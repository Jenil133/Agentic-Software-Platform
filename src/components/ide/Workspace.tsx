"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Sparkles,
  Play,
  Loader2,
  Share2,
} from "lucide-react";
import { FileTree } from "./FileTree";
import { EditorTabs } from "./EditorTabs";
import { AgentPanel } from "./AgentPanel";
import { OutputPanel } from "./OutputPanel";
import { PreviewPanel } from "./PreviewPanel";
import { ShareDialog } from "./ShareDialog";
import { DeployButton } from "./DeployButton";
import { PresenceAvatars } from "./PresenceAvatars";
import { CollabProvider, useCollab } from "@/lib/collab/provider";
import type { ProjectFile, EditorTab } from "@/lib/types";
import { getFileLanguage } from "@/lib/file-tree";
import type { AgentEvent } from "@/lib/agent/types";

const MonacoEditor = dynamic(() => import("./MonacoEditor"), { ssr: false });

type CurrentUser = { id: string; name: string; image: string | null };

type Props = {
  project: { id: string; name: string; template: string };
  files: ProjectFile[];
  currentUser: CurrentUser;
  role: "owner" | "editor" | "viewer";
};

export function Workspace(props: Props) {
  return (
    <CollabProvider
      projectId={props.project.id}
      user={props.currentUser}
      initialFiles={props.files.map((f) => ({
        path: f.path,
        contents: f.contents,
      }))}
    >
      <WorkspaceInner {...props} />
    </CollabProvider>
  );
}

function WorkspaceInner({ project, files: initialFiles, role }: Props) {
  const { peers, status } = useCollab();

  const [files, setFiles] = useState<ProjectFile[]>(initialFiles);
  const [tabs, setTabs] = useState<EditorTab[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [savingPath, setSavingPath] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([
    `[ready] project loaded with ${initialFiles.length} files`,
  ]);
  const [running, setRunning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const saveTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const activeTab = useMemo(
    () => tabs.find((t) => t.path === activePath) ?? null,
    [tabs, activePath],
  );

  const log = useCallback((line: string) => {
    setLogs((prev) => [...prev.slice(-499), line]);
  }, []);

  const openFile = useCallback(
    (path: string) => {
      const existing = tabs.find((t) => t.path === path);
      if (existing) {
        setActivePath(path);
        return;
      }
      const file = files.find((f) => f.path === path);
      if (!file) return;
      setTabs((t) => [...t, { path, contents: file.contents, dirty: false }]);
      setActivePath(path);
    },
    [files, tabs],
  );

  const closeTab = useCallback(
    (path: string) => {
      setTabs((prev) => {
        const next = prev.filter((t) => t.path !== path);
        if (activePath === path) {
          setActivePath(next.at(-1)?.path ?? null);
        }
        return next;
      });
    },
    [activePath],
  );

  const persistFile = useCallback(
    async (path: string, contents: string) => {
      if (role === "viewer") return;
      setSavingPath(path);
      try {
        const res = await fetch(`/api/projects/${project.id}/files`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ path, contents }),
        });
        if (!res.ok) throw new Error("save failed");
        setFiles((fs) => {
          const idx = fs.findIndex((f) => f.path === path);
          if (idx === -1) return [...fs, { id: path, path, contents }];
          const next = [...fs];
          next[idx] = { ...next[idx], contents };
          return next;
        });
        setTabs((ts) =>
          ts.map((t) => (t.path === path ? { ...t, dirty: false } : t)),
        );
      } catch (e) {
        log(`[save error] ${path}: ${(e as Error).message}`);
      } finally {
        setSavingPath((cur) => (cur === path ? null : cur));
      }
    },
    [project.id, log, role],
  );

  const onChangeTab = useCallback(
    (path: string, value: string) => {
      setTabs((ts) =>
        ts.map((t) =>
          t.path === path ? { ...t, contents: value, dirty: true } : t,
        ),
      );
      const prev = saveTimers.current.get(path);
      if (prev) clearTimeout(prev);
      saveTimers.current.set(
        path,
        setTimeout(() => persistFile(path, value), 1500),
      );
    },
    [persistFile],
  );

  const saveActive = useCallback(() => {
    if (!activeTab) return;
    const prev = saveTimers.current.get(activeTab.path);
    if (prev) clearTimeout(prev);
    void persistFile(activeTab.path, activeTab.contents);
  }, [activeTab, persistFile]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveActive();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saveActive]);

  const createFile = useCallback(
    async (path: string) => {
      if (files.some((f) => f.path === path)) {
        log(`[skip] file already exists: ${path}`);
        return;
      }
      await persistFile(path, "");
      openFile(path);
    },
    [files, persistFile, openFile, log],
  );

  const deleteFile = useCallback(
    async (path: string) => {
      const segs = path.split("/").map(encodeURIComponent).join("/");
      const res = await fetch(`/api/projects/${project.id}/files/${segs}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        log(`[delete error] ${path}`);
        return;
      }
      setFiles((fs) => fs.filter((f) => f.path !== path));
      setTabs((ts) => ts.filter((t) => t.path !== path));
      if (activePath === path) setActivePath(null);
    },
    [project.id, activePath, log],
  );

  const renameFile = useCallback(
    async (oldPath: string, newPath: string) => {
      if (oldPath === newPath) return;
      const segs = oldPath.split("/").map(encodeURIComponent).join("/");
      const res = await fetch(`/api/projects/${project.id}/files/${segs}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ newPath }),
      });
      if (!res.ok) {
        log(`[rename error] ${oldPath} -> ${newPath}`);
        return;
      }
      setFiles((fs) =>
        fs.map((f) => (f.path === oldPath ? { ...f, path: newPath } : f)),
      );
      setTabs((ts) =>
        ts.map((t) => (t.path === oldPath ? { ...t, path: newPath } : t)),
      );
      setActivePath((p) => (p === oldPath ? newPath : p));
    },
    [project.id, log],
  );

  const onAgentFileChange = useCallback(
    (e: Extract<AgentEvent, { type: "file_change" }>) => {
      if (e.action === "delete") {
        setFiles((fs) => fs.filter((f) => f.path !== e.path));
        setTabs((ts) => ts.filter((t) => t.path !== e.path));
        setActivePath((p) => (p === e.path ? null : p));
        log(`[agent] deleted ${e.path}`);
      } else if (e.action === "write" && typeof e.contents === "string") {
        setFiles((fs) => {
          const idx = fs.findIndex((f) => f.path === e.path);
          if (idx === -1)
            return [...fs, { id: e.path, path: e.path, contents: e.contents! }];
          const next = [...fs];
          next[idx] = { ...next[idx], contents: e.contents! };
          return next;
        });
        setTabs((ts) =>
          ts.map((t) =>
            t.path === e.path
              ? { ...t, contents: e.contents!, dirty: false }
              : t,
          ),
        );
        log(`[agent] wrote ${e.path} (${e.contents.length} bytes)`);
      } else if (e.action === "rename" && e.newPath) {
        setFiles((fs) =>
          fs.map((f) => (f.path === e.path ? { ...f, path: e.newPath! } : f)),
        );
        setTabs((ts) =>
          ts.map((t) => (t.path === e.path ? { ...t, path: e.newPath! } : t)),
        );
        setActivePath((p) => (p === e.path ? e.newPath! : p));
        log(`[agent] renamed ${e.path} → ${e.newPath}`);
      }
    },
    [log],
  );

  const runProject = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setPreviewUrl(null);
    try {
      log("[run] booting WebContainer…");
      const { mountFiles, runCommand, getWebContainer } = await import(
        "@/lib/webcontainer"
      );
      await mountFiles(files);
      const wc = await getWebContainer();
      wc.on("server-ready", (_port, url) => {
        log(`[run] server ready at ${url}`);
        setPreviewUrl(url);
      });

      const hasPackageJson = files.some((f) => f.path === "package.json");
      if (hasPackageJson) {
        log("[run] npm install…");
        const install = await runCommand("npm", ["install"], log);
        const code = await install.exit;
        if (code !== 0) {
          log(`[run] install failed (exit ${code})`);
          return;
        }
        const pkg = JSON.parse(
          files.find((f) => f.path === "package.json")?.contents ?? "{}",
        );
        const script = pkg?.scripts?.dev
          ? "dev"
          : pkg?.scripts?.start
            ? "start"
            : null;
        if (!script) {
          log("[run] no `dev` or `start` script found in package.json");
          return;
        }
        log(`[run] npm run ${script}…`);
        await runCommand("npm", ["run", script], log);
      } else {
        log("[run] no package.json — nothing to run");
      }
    } catch (e) {
      log(`[run error] ${(e as Error).message}`);
    } finally {
      setRunning(false);
    }
  }, [running, files, log]);

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100">
      <header className="flex items-center justify-between px-4 h-12 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/projects"
            className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200 transition shrink-0"
          >
            <ArrowLeft className="size-4" />
            Projects
          </Link>
          <span className="text-zinc-700 shrink-0">/</span>
          <span className="text-sm font-medium truncate">{project.name}</span>
          <span className="text-xs text-zinc-600 shrink-0">
            ({project.template})
          </span>
          {role !== "owner" && (
            <span className="text-[10px] uppercase tracking-wide text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-800 shrink-0">
              {role}
            </span>
          )}
          <span
            className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0 ${
              status === "connected"
                ? "text-emerald-400 border border-emerald-900/60 bg-emerald-950/40"
                : "text-zinc-500 border border-zinc-800"
            }`}
          >
            {status === "connected" ? "live" : status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <PresenceAvatars peers={peers} />
          {savingPath && (
            <span className="text-xs text-zinc-500 inline-flex items-center gap-1">
              <Loader2 className="size-3 animate-spin" />
              saving
            </span>
          )}
          {role === "owner" && (
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-md border border-zinc-800 hover:border-zinc-600 transition"
            >
              <Share2 className="size-3.5" />
              Share
            </button>
          )}
          <DeployButton projectId={project.id} canDeploy={role !== "viewer"} />
          <button
            type="button"
            onClick={saveActive}
            disabled={!activeTab?.dirty}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-md border border-zinc-800 hover:border-zinc-600 disabled:opacity-40 transition"
            title="Save (⌘S)"
          >
            <Save className="size-3.5" />
            Save
          </button>
          <button
            type="button"
            onClick={runProject}
            disabled={running}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition"
          >
            {running ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Play className="size-3.5" />
            )}
            Run
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={18} minSize={12} className="bg-zinc-950">
            <FileTree
              files={files}
              activePath={activePath}
              onOpen={openFile}
              onCreate={createFile}
              onDelete={deleteFile}
              onRename={renameFile}
            />
          </Panel>
          <PanelResizeHandle className="panel-resizer w-px" />

          <Panel defaultSize={52} minSize={30}>
            <PanelGroup direction="vertical">
              <Panel defaultSize={70} minSize={20}>
                <div className="flex flex-col h-full">
                  <EditorTabs
                    tabs={tabs}
                    activePath={activePath}
                    onSelect={setActivePath}
                    onClose={closeTab}
                  />
                  <div className="flex-1 min-h-0">
                    {activeTab ? (
                      <MonacoEditor
                        path={activeTab.path}
                        language={getFileLanguage(activeTab.path)}
                        onChange={(v) => onChangeTab(activeTab.path, v)}
                      />
                    ) : (
                      <EmptyEditor />
                    )}
                  </div>
                </div>
              </Panel>
              <PanelResizeHandle className="panel-resizer h-px" />
              <Panel defaultSize={30} minSize={10}>
                <PanelGroup direction="horizontal">
                  <Panel defaultSize={50}>
                    <OutputPanel logs={logs} onClear={() => setLogs([])} />
                  </Panel>
                  <PanelResizeHandle className="panel-resizer w-px" />
                  <Panel defaultSize={50}>
                    <PreviewPanel url={previewUrl} setUrl={setPreviewUrl} />
                  </Panel>
                </PanelGroup>
              </Panel>
            </PanelGroup>
          </Panel>
          <PanelResizeHandle className="panel-resizer w-px" />

          <Panel defaultSize={30} minSize={18}>
            <AgentPanel
              projectId={project.id}
              onFileChange={onAgentFileChange}
            />
          </Panel>
        </PanelGroup>
      </div>

      {shareOpen && (
        <ShareDialog
          projectId={project.id}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}

function EmptyEditor() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-2">
      <Sparkles className="size-8 opacity-50" />
      <p className="text-sm">Select a file from the tree to start editing.</p>
    </div>
  );
}
