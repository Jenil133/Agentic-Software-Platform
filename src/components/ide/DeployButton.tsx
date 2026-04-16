"use client";

import { useCallback, useEffect, useState } from "react";
import { Rocket, Loader2, ExternalLink } from "lucide-react";

type Deployment = {
  id: string;
  status: "pending" | "building" | "ready" | "error";
  url: string | null;
  createdAt: string;
};

export function DeployButton({
  projectId,
  canDeploy,
}: {
  projectId: string;
  canDeploy: boolean;
}) {
  const [latest, setLatest] = useState<Deployment | null>(null);
  const [open, setOpen] = useState(false);
  const [deploying, setDeploying] = useState(false);

  const fetchLatest = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/deploy`);
      if (res.ok) {
        const data = await res.json();
        const first = (data.deployments ?? [])[0] as Deployment | undefined;
        setLatest(first ?? null);
        if (first && (first.status === "pending" || first.status === "building")) {
          setDeploying(true);
        } else {
          setDeploying(false);
        }
      }
    } catch {}
  }, [projectId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- bootstrapping deployment data from server on mount
    void fetchLatest();
  }, [fetchLatest]);

  useEffect(() => {
    if (!deploying) return;
    const t = setInterval(fetchLatest, 1500);
    return () => clearInterval(t);
  }, [deploying, fetchLatest]);

  async function deploy() {
    if (!canDeploy || deploying) return;
    setDeploying(true);
    setOpen(true);
    await fetch(`/api/projects/${projectId}/deploy`, { method: "POST" });
    await fetchLatest();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          if (!latest) void deploy();
          else setOpen((o) => !o);
        }}
        disabled={!canDeploy}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-md border border-zinc-800 hover:border-zinc-600 disabled:opacity-40 transition"
        title={canDeploy ? "Deploy" : "Viewers can't deploy"}
      >
        {deploying ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Rocket className="size-3.5" />
        )}
        Deploy
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 w-72 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-40 p-3 space-y-2"
          onMouseLeave={() => setOpen(false)}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-zinc-500">
              Deployment
            </span>
            {latest && (
              <span
                className={`text-[10px] uppercase tracking-wide ${
                  latest.status === "ready"
                    ? "text-emerald-400"
                    : latest.status === "error"
                      ? "text-red-400"
                      : "text-amber-400"
                }`}
              >
                {latest.status}
              </span>
            )}
          </div>
          {latest?.url ? (
            <a
              href={latest.url}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 truncate"
            >
              <ExternalLink className="size-3.5 shrink-0" />
              {latest.url.replace(/^https?:\/\//, "")}
            </a>
          ) : (
            <p className="text-xs text-zinc-500">
              {deploying ? "Building…" : "No deployments yet."}
            </p>
          )}
          <button
            type="button"
            onClick={deploy}
            disabled={!canDeploy || deploying}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-md bg-white text-black hover:bg-zinc-200 disabled:opacity-50 transition"
          >
            {deploying ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Rocket className="size-3.5" />
            )}
            {latest ? "Redeploy" : "Deploy now"}
          </button>
          <p className="text-[10px] text-zinc-600 leading-relaxed">
            Vercel integration is mocked in this build — production wires
            this up to <code>vercel.com/api/v13/deployments</code>.
          </p>
        </div>
      )}
    </div>
  );
}
