"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles,
  Send,
  Loader2,
  Wrench,
  ChevronDown,
  ChevronRight,
  History,
} from "lucide-react";
import type { AgentEvent, ChatMessage, StoredRun } from "@/lib/agent/types";

type Props = {
  projectId: string;
  onFileChange: (
    e: Extract<AgentEvent, { type: "file_change" }>,
  ) => void;
};

export function AgentPanel({ projectId, onFileChange }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [tokensUsed, setTokensUsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/agent/history?projectId=${projectId}`)
      .then((r) => r.json())
      .then((data: { runs?: StoredRun[] }) => {
        if (cancelled || !data.runs) return;
        const restored: ChatMessage[] = [];
        let totalTokens = 0;
        for (const run of data.runs) {
          totalTokens += run.tokensUsed ?? 0;
          for (const m of run.messages) {
            if (m.role === "user") {
              restored.push({ kind: "user", id: m.id, content: m.content });
            } else if (m.role === "assistant") {
              restored.push({
                kind: "assistant",
                id: m.id,
                content: m.content,
              });
            } else if (m.role === "tool") {
              restored.push({
                kind: "tool",
                id: m.id,
                name: m.toolName ?? "tool",
                args: m.toolArgs ? safeParse(m.toolArgs) : {},
                result: m.toolResult ?? undefined,
                status: "done",
              });
            }
          }
        }
        setMessages(restored);
        setTokensUsed(totalTokens);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = useCallback(async () => {
    const prompt = input.trim();
    if (!prompt || running) return;
    setInput("");
    setError(null);
    setRunning(true);
    const userId = `u_${Date.now()}`;
    setMessages((m) => [
      ...m,
      { kind: "user", id: userId, content: prompt },
    ]);

    const assistantId = `a_${Date.now()}`;
    let assistantBuffered = false;

    try {
      const res = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId, prompt }),
      });
      if (!res.ok || !res.body) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith("data:")) continue;
          const json = line.slice(5).trim();
          if (!json) continue;
          let event: AgentEvent;
          try {
            event = JSON.parse(json) as AgentEvent;
          } catch {
            continue;
          }
          handleEvent(event);
        }
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRunning(false);
    }

    function handleEvent(event: AgentEvent) {
      switch (event.type) {
        case "token": {
          setMessages((m) => {
            if (!assistantBuffered) {
              assistantBuffered = true;
              return [
                ...m,
                {
                  kind: "assistant",
                  id: assistantId,
                  content: event.text,
                  streaming: true,
                },
              ];
            }
            return m.map((msg) =>
              msg.kind === "assistant" && msg.id === assistantId
                ? { ...msg, content: msg.content + event.text }
                : msg,
            );
          });
          break;
        }
        case "message_end": {
          setMessages((m) =>
            m.map((msg) =>
              msg.kind === "assistant" && msg.id === assistantId
                ? { ...msg, streaming: false }
                : msg,
            ),
          );
          assistantBuffered = false;
          break;
        }
        case "tool_start": {
          setMessages((m) => [
            ...m,
            {
              kind: "tool",
              id: event.callId,
              name: event.tool,
              args: event.args,
              status: "running",
            },
          ]);
          break;
        }
        case "tool_end": {
          setMessages((m) =>
            m.map((msg) =>
              msg.kind === "tool" && msg.id === event.callId
                ? { ...msg, result: event.result, status: "done" }
                : msg,
            ),
          );
          break;
        }
        case "file_change": {
          onFileChange(event);
          break;
        }
        case "run_end": {
          setTokensUsed((t) => t + event.tokensUsed);
          break;
        }
        case "error": {
          setError(event.error);
          break;
        }
      }
    }
  }, [input, running, projectId, onFileChange]);

  const placeholder = useMemo(
    () =>
      messages.length === 0
        ? "Build me a Pomodoro timer with local storage…"
        : "Ask the agent to refine, add features, or fix bugs…",
    [messages.length],
  );

  return (
    <div className="h-full flex flex-col bg-zinc-950 border-l border-zinc-800">
      <div className="flex items-center justify-between px-3 h-9 border-b border-zinc-800 shrink-0">
        <span className="text-xs uppercase tracking-wide text-zinc-500 inline-flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-blue-400" />
          Agent
        </span>
        <span className="text-[10px] text-zinc-500 inline-flex items-center gap-1">
          <History className="size-3" />
          {tokensUsed.toLocaleString()} tokens
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && !running && (
          <div className="rounded-md border border-dashed border-zinc-800 p-4 text-sm text-zinc-500 space-y-2">
            <p>
              Describe a feature or change. The agent will read your files,
              plan, and apply edits.
            </p>
            <p className="text-xs text-zinc-600">
              Tools available: list_files, read_file, write_file, delete_file,
              search_files, install_package.
            </p>
          </div>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} msg={m} />
        ))}
        {error && (
          <div className="rounded-md border border-red-900 bg-red-950/40 text-red-300 px-3 py-2 text-xs">
            {error}
          </div>
        )}
        {running && messages.at(-1)?.kind !== "assistant" && (
          <div className="text-xs text-zinc-500 inline-flex items-center gap-1.5">
            <Loader2 className="size-3 animate-spin" />
            thinking…
          </div>
        )}
      </div>

      <div className="p-3 border-t border-zinc-800 shrink-0">
        <div className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 focus-within:border-zinc-600">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            disabled={running}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-zinc-600 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={send}
            disabled={!input.trim() || running}
            className="text-zinc-300 disabled:text-zinc-600 disabled:cursor-not-allowed hover:text-zinc-100"
          >
            {running ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  if (msg.kind === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-lg bg-blue-600 text-white px-3 py-2 text-sm whitespace-pre-wrap">
          {msg.content}
        </div>
      </div>
    );
  }
  if (msg.kind === "assistant") {
    return (
      <div className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
        {msg.content}
        {msg.streaming && (
          <span className="inline-block w-1.5 h-3.5 bg-blue-400 align-baseline ml-0.5 animate-pulse" />
        )}
      </div>
    );
  }
  return <ToolBubble msg={msg} />;
}

function ToolBubble({
  msg,
}: {
  msg: Extract<ChatMessage, { kind: "tool" }>;
}) {
  const [open, setOpen] = useState(false);
  const argsStr =
    typeof msg.args === "string" ? msg.args : JSON.stringify(msg.args ?? {});
  const summary =
    msg.name === "write_file" && typeof msg.args === "object" && msg.args
      ? `→ ${(msg.args as { path?: string }).path ?? ""}`
      : msg.name === "read_file" && typeof msg.args === "object" && msg.args
        ? `← ${(msg.args as { path?: string }).path ?? ""}`
        : msg.name === "search_files" && typeof msg.args === "object" && msg.args
          ? `"${(msg.args as { query?: string }).query ?? ""}"`
          : "";

  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900/40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900"
      >
        {open ? (
          <ChevronDown className="size-3 shrink-0" />
        ) : (
          <ChevronRight className="size-3 shrink-0" />
        )}
        <Wrench className="size-3 shrink-0 text-amber-400" />
        <span className="font-mono text-amber-300">{msg.name}</span>
        <span className="truncate text-zinc-500 flex-1 text-left">
          {summary}
        </span>
        {msg.status === "running" ? (
          <Loader2 className="size-3 animate-spin text-zinc-500 shrink-0" />
        ) : (
          <span className="text-[10px] text-zinc-600 shrink-0">done</span>
        )}
      </button>
      {open && (
        <div className="border-t border-zinc-800 p-2.5 space-y-2 text-[11px] font-mono">
          <div>
            <div className="text-zinc-500 uppercase text-[10px]">args</div>
            <pre className="text-zinc-300 whitespace-pre-wrap break-words">
              {argsStr}
            </pre>
          </div>
          {msg.result && (
            <div>
              <div className="text-zinc-500 uppercase text-[10px]">result</div>
              <pre className="text-zinc-300 whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                {msg.result}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}
