"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";

const COLORS = [
  "#60a5fa",
  "#a78bfa",
  "#f472b6",
  "#34d399",
  "#facc15",
  "#fb7185",
  "#22d3ee",
  "#f97316",
];

export type CollabUser = {
  id: string;
  name: string;
  color: string;
  image: string | null;
};

export type AwarenessState = {
  user: CollabUser;
  cursor?: { path: string; line: number; column: number };
};

type CollabContextValue = {
  doc: Y.Doc;
  provider: WebrtcProvider;
  files: Y.Map<Y.Text>;
  user: CollabUser;
  peers: AwarenessState[];
  status: "connecting" | "connected" | "disconnected";
};

const CollabContext = createContext<CollabContextValue | null>(null);

export function useCollab() {
  const ctx = useContext(CollabContext);
  if (!ctx) throw new Error("useCollab must be inside CollabProvider");
  return ctx;
}

export function CollabProvider({
  projectId,
  user,
  initialFiles,
  children,
}: {
  projectId: string;
  user: { id: string; name: string; image: string | null };
  initialFiles: { path: string; contents: string }[];
  children: React.ReactNode;
}) {
  const colorIndex = useMemo(() => {
    let h = 0;
    for (let i = 0; i < user.id.length; i++)
      h = (h * 31 + user.id.charCodeAt(i)) | 0;
    return Math.abs(h) % COLORS.length;
  }, [user.id]);

  const me = useMemo<CollabUser>(
    () => ({
      id: user.id,
      name: user.name,
      color: COLORS[colorIndex],
      image: user.image,
    }),
    [user.id, user.name, user.image, colorIndex],
  );

  const [bundle, setBundle] = useState<{
    doc: Y.Doc;
    provider: WebrtcProvider;
    files: Y.Map<Y.Text>;
  } | null>(null);
  const [peers, setPeers] = useState<AwarenessState[]>([]);
  const [status, setStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");

  useEffect(() => {
    const doc = new Y.Doc();
    const provider = new WebrtcProvider(`agentic-platform-${projectId}`, doc, {
      signaling: ["wss://signaling.yjs.dev"],
    });

    const files = doc.getMap<Y.Text>("files");

    const seed = () => {
      if (files.size === 0) {
        doc.transact(() => {
          for (const f of initialFiles) {
            const ytext = new Y.Text();
            ytext.insert(0, f.contents);
            files.set(f.path, ytext);
          }
        });
      }
    };
    seed();

    provider.awareness.setLocalStateField("user", me);

    const onAwareness = () => {
      const states: AwarenessState[] = [];
      provider.awareness.getStates().forEach((state, clientId) => {
        if (clientId === provider.awareness.clientID) return;
        if (state?.user) states.push(state as AwarenessState);
      });
      setPeers(states);
    };
    provider.awareness.on("change", onAwareness);
    onAwareness();

    const onStatus = (e: { connected: boolean }) => {
      setStatus(e.connected ? "connected" : "disconnected");
    };
    provider.on("status", onStatus);

    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard pattern for binding an external client to React state on mount
    setBundle({ doc, provider, files });

    return () => {
      provider.awareness.off("change", onAwareness);
      provider.off("status", onStatus);
      provider.destroy();
      doc.destroy();
    };
  }, [projectId, me, initialFiles]);

  if (!bundle) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm">
        Connecting to collaboration session…
      </div>
    );
  }

  const value: CollabContextValue = {
    doc: bundle.doc,
    provider: bundle.provider,
    files: bundle.files,
    user: me,
    peers,
    status,
  };

  return (
    <CollabContext.Provider value={value}>{children}</CollabContext.Provider>
  );
}
