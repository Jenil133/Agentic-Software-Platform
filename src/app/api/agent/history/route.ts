import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: session.user.id },
  });
  if (!project) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const runs = await prisma.agentRun.findMany({
    where: { projectId },
    orderBy: { startedAt: "asc" },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  return NextResponse.json({
    runs: runs.map((r) => ({
      id: r.id,
      prompt: r.prompt,
      status: r.status,
      tokensUsed: r.tokensUsed,
      startedAt: r.startedAt,
      finishedAt: r.finishedAt,
      messages: r.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        toolName: m.toolName,
        toolCallId: m.toolCallId,
        toolArgs: m.toolArgs,
        toolResult: m.toolResult,
        createdAt: m.createdAt,
      })),
    })),
  });
}
