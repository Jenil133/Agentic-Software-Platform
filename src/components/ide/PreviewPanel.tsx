"use client";

import { Globe, ExternalLink } from "lucide-react";

export function PreviewPanel({
  url,
  setUrl,
}: {
  url: string | null;
  setUrl: (u: string | null) => void;
}) {
  return (
    <div className="h-full flex flex-col bg-zinc-950 border-t border-l border-zinc-800">
      <div className="flex items-center gap-2 px-3 h-8 border-b border-zinc-800 shrink-0">
        <Globe className="size-3.5 text-zinc-500" />
        <input
          value={url ?? ""}
          onChange={(e) => setUrl(e.target.value || null)}
          placeholder="Preview URL appears here when sandbox runs"
          className="flex-1 bg-transparent text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none font-mono"
        />
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener"
            className="text-zinc-500 hover:text-zinc-200"
            title="Open in new tab"
          >
            <ExternalLink className="size-3.5" />
          </a>
        )}
      </div>
      <div className="flex-1 bg-white">
        {url ? (
          <iframe src={url} className="w-full h-full border-0" title="Preview" />
        ) : (
          <div className="h-full flex items-center justify-center text-zinc-400 text-sm bg-zinc-950">
            Run the project to see a live preview here.
          </div>
        )}
      </div>
    </div>
  );
}
