"use client";

import { X } from "lucide-react";
import type { EditorTab } from "@/lib/types";

type Props = {
  tabs: EditorTab[];
  activePath: string | null;
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
};

export function EditorTabs({ tabs, activePath, onSelect, onClose }: Props) {
  if (tabs.length === 0) {
    return (
      <div className="h-9 border-b border-zinc-800 bg-zinc-950 shrink-0" />
    );
  }
  return (
    <div className="flex items-stretch border-b border-zinc-800 bg-zinc-950 shrink-0 overflow-x-auto">
      {tabs.map((tab) => {
        const active = tab.path === activePath;
        return (
          <button
            key={tab.path}
            type="button"
            onClick={() => onSelect(tab.path)}
            className={`group relative flex items-center gap-2 px-3 h-9 text-xs border-r border-zinc-800 ${
              active
                ? "bg-zinc-900 text-zinc-100"
                : "text-zinc-400 hover:bg-zinc-900/50"
            }`}
          >
            <span className="truncate max-w-[160px]">
              {tab.path.split("/").pop()}
            </span>
            {tab.dirty && (
              <span className="size-1.5 rounded-full bg-blue-400" />
            )}
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onClose(tab.path);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose(tab.path);
                }
              }}
              className="opacity-0 group-hover:opacity-100 hover:bg-zinc-700 rounded p-0.5 transition cursor-pointer"
              aria-label="Close tab"
            >
              <X className="size-3" />
            </span>
            {active && (
              <span className="absolute bottom-0 left-0 right-0 h-px bg-blue-500" />
            )}
          </button>
        );
      })}
    </div>
  );
}
