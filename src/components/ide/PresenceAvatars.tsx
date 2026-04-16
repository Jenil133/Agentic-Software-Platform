"use client";

import type { AwarenessState } from "@/lib/collab/provider";

export function PresenceAvatars({ peers }: { peers: AwarenessState[] }) {
  if (peers.length === 0) return null;
  const visible = peers.slice(0, 4);
  const overflow = peers.length - visible.length;
  return (
    <div className="flex items-center -space-x-1.5 mr-1">
      {visible.map((p) => (
        <Avatar key={p.user.id} state={p} />
      ))}
      {overflow > 0 && (
        <span className="size-6 rounded-full bg-zinc-800 border border-zinc-950 text-[10px] font-medium text-zinc-300 flex items-center justify-center">
          +{overflow}
        </span>
      )}
    </div>
  );
}

function Avatar({ state }: { state: AwarenessState }) {
  const initials = state.user.name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      title={`${state.user.name}${state.cursor ? ` — ${state.cursor.path}:${state.cursor.line}` : ""}`}
      className="size-6 rounded-full border-2 flex items-center justify-center text-[10px] font-semibold"
      style={{
        backgroundColor: state.user.color,
        borderColor: "#09090b",
        color: "#09090b",
      }}
    >
      {state.user.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={state.user.image}
          alt={state.user.name}
          className="size-full rounded-full"
        />
      ) : (
        initials || "?"
      )}
    </div>
  );
}
