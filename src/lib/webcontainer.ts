"use client";

import { WebContainer, type FileSystemTree } from "@webcontainer/api";
import type { ProjectFile } from "@/lib/types";

let bootPromise: Promise<WebContainer> | null = null;

export async function getWebContainer(): Promise<WebContainer> {
  if (!bootPromise) {
    bootPromise = WebContainer.boot();
  }
  return bootPromise;
}

export function filesToFsTree(files: ProjectFile[]): FileSystemTree {
  const tree: FileSystemTree = {};

  for (const f of files) {
    const parts = f.path.split("/").filter(Boolean);
    let cursor: FileSystemTree = tree;
    parts.forEach((part, i) => {
      if (i === parts.length - 1) {
        cursor[part] = { file: { contents: f.contents } };
      } else {
        const existing = cursor[part];
        if (!existing || !("directory" in existing)) {
          cursor[part] = { directory: {} };
        }
        cursor = (cursor[part] as { directory: FileSystemTree }).directory;
      }
    });
  }

  return tree;
}

export async function mountFiles(files: ProjectFile[]) {
  const wc = await getWebContainer();
  await wc.mount(filesToFsTree(files));
  return wc;
}

export async function runCommand(
  cmd: string,
  args: string[],
  onOutput: (chunk: string) => void,
) {
  const wc = await getWebContainer();
  const proc = await wc.spawn(cmd, args);
  proc.output.pipeTo(
    new WritableStream({
      write(chunk) {
        onOutput(chunk);
      },
    }),
  );
  return proc;
}
