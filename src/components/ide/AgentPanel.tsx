"use client";

import { Sparkles, Send, Lock } from "lucide-react";

export function AgentPanel({ projectId }: { projectId: string }) {
  return (
    <div className="h-full flex flex-col bg-zinc-950 border-l border-zinc-800">
      <div className="flex items-center justify-between px-3 h-9 border-b border-zinc-800 shrink-0">
        <span className="text-xs uppercase tracking-wide text-zinc-500 inline-flex items-center gap-1.5">
          <Sparkles className="size-3.5" />
          Agent
        </span>
        <span className="text-[10px] text-zinc-600 inline-flex items-center gap-1">
          <Lock className="size-3" />
          Phase 2
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="rounded-md border border-dashed border-zinc-800 p-4 text-sm text-zinc-500">
          The AI agent panel arrives in Phase 2. It will let you describe
          changes in natural language and watch the agent edit your code with
          inline diffs and approval.
        </div>
        <ul className="text-xs text-zinc-600 space-y-1.5">
          <li>• LangChain orchestration</li>
          <li>• File / run / install / search tools</li>
          <li>• Streaming plan + diffs</li>
          <li>• Per-project token budget</li>
        </ul>
      </div>
      <div className="p-3 border-t border-zinc-800 shrink-0">
        <div className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 opacity-50">
          <input
            disabled
            placeholder="Build me a… (Phase 2)"
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-zinc-600"
          />
          <button type="button" disabled className="text-zinc-600">
            <Send className="size-4" />
          </button>
        </div>
        <p className="mt-2 text-[10px] text-zinc-600">
          Project: <span className="font-mono">{projectId.slice(0, 8)}</span>
        </p>
      </div>
    </div>
  );
}
