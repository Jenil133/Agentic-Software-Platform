"use client";

import { useEffect, useRef } from "react";
import { Terminal, Eraser } from "lucide-react";

export function OutputPanel({
  logs,
  onClear,
}: {
  logs: string[];
  onClear: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  return (
    <div className="h-full flex flex-col bg-zinc-950 border-t border-zinc-800">
      <div className="flex items-center justify-between px-3 h-8 border-b border-zinc-800 shrink-0">
        <span className="text-xs uppercase tracking-wide text-zinc-500 inline-flex items-center gap-1.5">
          <Terminal className="size-3.5" />
          Output
        </span>
        <button
          type="button"
          onClick={onClear}
          title="Clear"
          className="text-zinc-500 hover:text-zinc-200"
        >
          <Eraser className="size-3.5" />
        </button>
      </div>
      <div
        ref={ref}
        className="flex-1 overflow-y-auto px-3 py-2 font-mono text-xs leading-relaxed text-zinc-300"
      >
        {logs.length === 0 ? (
          <span className="text-zinc-700">No output.</span>
        ) : (
          logs.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap">
              {line}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
