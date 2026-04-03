import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { buildAgent } from "@/lib/agent/agent";
import type { ToolEvent } from "@/lib/agent/tools";

export const runtime = "nodejs";
export const maxDuration = 300;

type AgentEvent =
  | { type: "run_start"; runId: string }
  | { type: "token"; text: string }
  | { type: "message_end"; content: string }
  | { type: "tool_start"; tool: string; args: unknown; callId: string }
  | { type: "tool_end"; tool: string; callId: string; result: string }
  | {
      type: "file_change";
      action: "write" | "delete" | "rename";
      path: string;
      newPath?: string;
      contents?: string;
    }
  | { type: "run_end"; tokensUsed: number }
  | { type: "error"; error: string };

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("unauthorized", { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const projectId = body.projectId as string | undefined;
  const prompt = (body.prompt as string | undefined)?.trim();
  if (!projectId || !prompt) {
    return new Response("bad request", { status: 400 });
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: session.user.id },
  });
  if (!project) return new Response("not found", { status: 404 });

  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      "OPENAI_API_KEY not set on the server. Add it to .env.local and restart.",
      { status: 500 },
    );
  }

  const recent = await prisma.agentRun.findMany({
    where: { projectId, status: "complete" },
    orderBy: { startedAt: "desc" },
    take: 5,
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  const history: { role: "user" | "assistant"; content: string }[] = [];
  for (const run of recent.reverse()) {
    history.push({ role: "user", content: run.prompt });
    const final = run.messages.findLast?.((m) => m.role === "assistant");
    if (final) history.push({ role: "assistant", content: final.content });
  }

  const run = await prisma.agentRun.create({
    data: { projectId, userId: session.user.id, prompt, status: "running" },
  });
  await prisma.message.create({
    data: { agentRunId: run.id, role: "user", content: prompt },
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: AgentEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(e)}\n\n`));
      };
      send({ type: "run_start", runId: run.id });

      let tokensUsed = 0;
      const toolCallIdToName = new Map<string, string>();
      let assistantBuffer = "";

      try {
        const { agent, messages } = buildAgent({
          projectId,
          prompt,
          history,
          emit: (event: ToolEvent) => {
            if (event.type === "file_change") send(event);
          },
        });

        const eventStream = agent.streamEvents(
          { messages },
          { version: "v2", recursionLimit: 30 },
        );

        for await (const event of eventStream) {
          if (event.event === "on_chat_model_stream") {
            const chunk = event.data?.chunk;
            const text = chunk?.content;
            if (typeof text === "string" && text.length > 0) {
              assistantBuffer += text;
              send({ type: "token", text });
            }
          } else if (event.event === "on_chat_model_end") {
            const usage = event.data?.output?.usage_metadata;
            if (usage?.total_tokens) tokensUsed += usage.total_tokens;
            if (assistantBuffer.trim()) {
              await prisma.message.create({
                data: {
                  agentRunId: run.id,
                  role: "assistant",
                  content: assistantBuffer,
                },
              });
              send({ type: "message_end", content: assistantBuffer });
              assistantBuffer = "";
            }
          } else if (event.event === "on_tool_start") {
            const callId = event.run_id;
            const toolName = event.name;
            toolCallIdToName.set(callId, toolName);
            const args = event.data?.input;
            send({ type: "tool_start", tool: toolName, args, callId });
            await prisma.message.create({
              data: {
                agentRunId: run.id,
                role: "tool",
                content: "",
                toolName,
                toolCallId: callId,
                toolArgs: JSON.stringify(args ?? {}),
              },
            });
          } else if (event.event === "on_tool_end") {
            const callId = event.run_id;
            const toolName =
              toolCallIdToName.get(callId) ?? event.name ?? "tool";
            const raw = event.data?.output;
            const result =
              typeof raw === "string"
                ? raw
                : raw?.content
                  ? typeof raw.content === "string"
                    ? raw.content
                    : JSON.stringify(raw.content)
                  : JSON.stringify(raw ?? "");
            send({ type: "tool_end", tool: toolName, callId, result });
            await prisma.message.updateMany({
              where: { agentRunId: run.id, toolCallId: callId },
              data: { toolResult: result },
            });
          }
        }

        await prisma.agentRun.update({
          where: { id: run.id },
          data: {
            status: "complete",
            tokensUsed,
            finishedAt: new Date(),
          },
        });
        send({ type: "run_end", tokensUsed });
      } catch (e) {
        const msg = (e as Error).message ?? String(e);
        await prisma.agentRun.update({
          where: { id: run.id },
          data: {
            status: "error",
            result: msg,
            finishedAt: new Date(),
          },
        });
        send({ type: "error", error: msg });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
