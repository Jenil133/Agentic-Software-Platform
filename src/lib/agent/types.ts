export type AgentEvent =
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

export type ChatMessage =
  | { kind: "user"; id: string; content: string }
  | {
      kind: "assistant";
      id: string;
      content: string;
      streaming?: boolean;
    }
  | {
      kind: "tool";
      id: string;
      name: string;
      args: unknown;
      result?: string;
      status: "running" | "done";
    };

export type StoredRun = {
  id: string;
  prompt: string;
  status: string;
  tokensUsed: number;
  startedAt: string;
  finishedAt: string | null;
  messages: {
    id: string;
    role: string;
    content: string;
    toolName: string | null;
    toolCallId: string | null;
    toolArgs: string | null;
    toolResult: string | null;
    createdAt: string;
  }[];
};
