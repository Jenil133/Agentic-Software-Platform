"use client";

import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  File as FileIcon,
  Folder,
  FolderOpen,
  Plus,
  Trash2,
  Pencil,
} from "lucide-react";
import type { ProjectFile, FileTreeNode } from "@/lib/types";
import { buildFileTree } from "@/lib/file-tree";

type Props = {
  files: ProjectFile[];
  activePath: string | null;
  onOpen: (path: string) => void;
  onCreate: (path: string) => void;
  onDelete: (path: string) => void;
  onRename: (oldPath: string, newPath: string) => void;
};

export function FileTree({
  files,
  activePath,
  onOpen,
  onCreate,
  onDelete,
  onRename,
}: Props) {
  const tree = buildFileTree(files);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 h-9 border-b border-zinc-800 shrink-0">
        <span className="text-xs uppercase tracking-wide text-zinc-500">
          Files
        </span>
        <button
          type="button"
          onClick={() => setCreating(true)}
          title="New file"
          className="text-zinc-500 hover:text-zinc-200 transition"
        >
          <Plus className="size-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-2 text-sm">
        {creating && (
          <div className="px-2 py-1">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newName.trim()) {
                  onCreate(newName.trim());
                  setCreating(false);
                  setNewName("");
                } else if (e.key === "Escape") {
                  setCreating(false);
                  setNewName("");
                }
              }}
              onBlur={() => {
                if (newName.trim()) onCreate(newName.trim());
                setCreating(false);
                setNewName("");
              }}
              placeholder="path/to/file.ts"
              className="w-full bg-zinc-900 border border-zinc-700 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        )}
        {tree.map((node) => (
          <TreeNode
            key={node.path}
            node={node}
            depth={0}
            activePath={activePath}
            onOpen={onOpen}
            onDelete={onDelete}
            onRename={onRename}
          />
        ))}
        {tree.length === 0 && !creating && (
          <p className="text-xs text-zinc-600 px-3 py-2">
            No files yet. Click + to create one.
          </p>
        )}
      </div>
    </div>
  );
}

function TreeNode({
  node,
  depth,
  activePath,
  onOpen,
  onDelete,
  onRename,
}: {
  node: FileTreeNode;
  depth: number;
  activePath: string | null;
  onOpen: (path: string) => void;
  onDelete: (path: string) => void;
  onRename: (oldPath: string, newPath: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.name);
  const isFile = node.type === "file";
  const isActive = isFile && activePath === node.path;

  const padding = { paddingLeft: 8 + depth * 12 };

  if (renaming) {
    return (
      <div className="px-2 py-0.5" style={padding}>
        <input
          autoFocus
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && renameValue.trim()) {
              const segs = node.path.split("/");
              segs[segs.length - 1] = renameValue.trim();
              onRename(node.path, segs.join("/"));
              setRenaming(false);
            } else if (e.key === "Escape") {
              setRenaming(false);
              setRenameValue(node.name);
            }
          }}
          onBlur={() => setRenaming(false)}
          className="w-full bg-zinc-900 border border-zinc-700 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-blue-500"
        />
      </div>
    );
  }

  return (
    <div>
      <div
        className={`group flex items-center gap-1 py-1 pr-2 cursor-pointer hover:bg-zinc-900 ${
          isActive ? "bg-zinc-900 text-zinc-100" : "text-zinc-400"
        }`}
        style={padding}
        onClick={() => (isFile ? onOpen(node.path) : setOpen((o) => !o))}
      >
        {isFile ? (
          <FileIcon className="size-3.5 shrink-0 text-zinc-500" />
        ) : (
          <>
            {open ? (
              <ChevronDown className="size-3 shrink-0" />
            ) : (
              <ChevronRight className="size-3 shrink-0" />
            )}
            {open ? (
              <FolderOpen className="size-3.5 shrink-0 text-blue-400" />
            ) : (
              <Folder className="size-3.5 shrink-0 text-blue-400" />
            )}
          </>
        )}
        <span className="truncate flex-1">{node.name}</span>
        {isFile && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setRenaming(true);
              }}
              title="Rename"
              className="hover:text-zinc-100 p-0.5"
            >
              <Pencil className="size-3" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete ${node.path}?`)) onDelete(node.path);
              }}
              title="Delete"
              className="hover:text-red-400 p-0.5"
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        )}
      </div>
      {!isFile && open && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              activePath={activePath}
              onOpen={onOpen}
              onDelete={onDelete}
              onRename={onRename}
            />
          ))}
        </div>
      )}
    </div>
  );
}
