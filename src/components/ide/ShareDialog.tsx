"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Loader2, Trash2, X, Users, Check } from "lucide-react";

type Token = {
  id: string;
  token: string;
  role: string;
  createdAt: string;
  expiresAt: string | null;
};

type Member = {
  id: string;
  role: string;
  user: { name: string | null; email: string | null; image: string | null };
};

export function ShareDialog({
  projectId,
  onClose,
}: {
  projectId: string;
  onClose: () => void;
}) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [copied, setCopied] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/share`);
      if (res.ok) {
        const data = await res.json();
        setTokens(data.tokens ?? []);
        setMembers(data.members ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading share data from server on mount
    void refresh();
  }, [refresh]);

  async function createToken() {
    setCreating(true);
    try {
      await fetch(`/api/projects/${projectId}/share`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role }),
      });
      await refresh();
    } finally {
      setCreating(false);
    }
  }

  async function revokeToken(id: string) {
    await fetch(`/api/projects/${projectId}/share?tokenId=${id}`, {
      method: "DELETE",
    });
    await refresh();
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold inline-flex items-center gap-2">
              <Users className="size-4" />
              Share project
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Generate a link to invite collaborators. Anyone with the link
              who signs in becomes a member.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "editor" | "viewer")}
            className="bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:border-zinc-600"
          >
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <button
            type="button"
            onClick={createToken}
            disabled={creating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-white text-black hover:bg-zinc-200 disabled:opacity-50 transition"
          >
            {creating && <Loader2 className="size-3.5 animate-spin" />}
            Create link
          </button>
        </div>

        <section className="space-y-2">
          <h3 className="text-xs uppercase tracking-wide text-zinc-500">
            Active links
          </h3>
          {loading ? (
            <p className="text-sm text-zinc-500">Loading…</p>
          ) : tokens.length === 0 ? (
            <p className="text-sm text-zinc-600">No active share links yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {tokens.map((t) => {
                const url =
                  typeof window !== "undefined"
                    ? `${window.location.origin}/share/${t.token}`
                    : `/share/${t.token}`;
                return (
                  <li
                    key={t.id}
                    className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5"
                  >
                    <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      {t.role}
                    </span>
                    <code className="flex-1 truncate text-xs text-zinc-400">
                      {url}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyLink(t.token)}
                      title="Copy"
                      className="text-zinc-500 hover:text-zinc-200"
                    >
                      {copied === t.token ? (
                        <Check className="size-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => revokeToken(t.id)}
                      title="Revoke"
                      className="text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="text-xs uppercase tracking-wide text-zinc-500">
            Collaborators
          </h3>
          {members.length === 0 ? (
            <p className="text-sm text-zinc-600">
              No one has joined yet. Share a link above to invite people.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-2 text-sm"
                >
                  <div className="size-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs">
                    {m.user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.user.image}
                        alt=""
                        className="size-full rounded-full"
                      />
                    ) : (
                      (m.user.name ?? m.user.email ?? "?")[0].toUpperCase()
                    )}
                  </div>
                  <span className="flex-1 truncate">
                    {m.user.name ?? m.user.email ?? "Unknown"}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-zinc-500">
                    {m.role}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
