import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { buildProjectTools, type ToolEvent } from "./tools";

const SYSTEM_PROMPT = `You are an expert AI software engineer working inside a web-based IDE called Agentic Software Platform.

You have full read/write access to the user's project via tools. The user describes what they want; you make it real by calling tools to read existing files and write new ones.

Working principles:
- Plan briefly before acting. Explain your plan in 1–3 short bullets, then execute.
- ALWAYS use list_files first when starting a task on a project you haven't seen, so you understand the structure.
- When writing code, write complete, runnable files (not snippets). Use write_file with the full new contents.
- Prefer modifying existing files over creating parallel new ones.
- For Node projects, keep package.json valid JSON and bump dependencies via install_package.
- After making changes, summarize what you did in 1–2 sentences.
- Be concise. Don't restate tool results back to the user — they can see them.

Style: write idiomatic, modern code. Avoid unnecessary comments. Use TypeScript where applicable.`;

export type AgentRunOptions = {
  projectId: string;
  prompt: string;
  history: { role: "user" | "assistant"; content: string }[];
  emit: (event: ToolEvent) => void;
  apiKey?: string;
  model?: string;
};

export function buildAgent(opts: AgentRunOptions) {
  const llm = new ChatOpenAI({
    model: opts.model ?? "gpt-4o",
    temperature: 0.2,
    streaming: true,
    apiKey: opts.apiKey ?? process.env.OPENAI_API_KEY,
  });

  const tools = buildProjectTools({
    projectId: opts.projectId,
    emit: opts.emit,
  });

  const agent = createReactAgent({
    llm,
    tools,
  });

  const messages = [
    new SystemMessage(SYSTEM_PROMPT),
    ...opts.history.map((m) =>
      m.role === "user"
        ? new HumanMessage(m.content)
        : new HumanMessage({ content: m.content }),
    ),
    new HumanMessage(opts.prompt),
  ];

  return { agent, messages };
}
