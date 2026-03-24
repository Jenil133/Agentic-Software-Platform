import type { FileTreeNode, ProjectFile } from "@/lib/types";

export function buildFileTree(files: Pick<ProjectFile, "path">[]): FileTreeNode[] {
  const root: FileTreeNode = { name: "", path: "", type: "folder", children: [] };

  for (const f of files) {
    const parts = f.path.split("/").filter(Boolean);
    let cursor = root;
    let current = "";
    parts.forEach((part, i) => {
      current = current ? `${current}/${part}` : part;
      const isFile = i === parts.length - 1;
      const existing = cursor.children?.find((c) => c.name === part);
      if (existing) {
        cursor = existing;
        return;
      }
      const node: FileTreeNode = {
        name: part,
        path: current,
        type: isFile ? "file" : "folder",
        children: isFile ? undefined : [],
      };
      cursor.children!.push(node);
      cursor = node;
    });
  }

  const sortNodes = (nodes: FileTreeNode[]): FileTreeNode[] =>
    nodes
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
      .map((n) => (n.children ? { ...n, children: sortNodes(n.children) } : n));

  return sortNodes(root.children ?? []);
}

export function getFileLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "ts":
    case "tsx":
      return "typescript";
    case "js":
    case "jsx":
      return "javascript";
    case "json":
      return "json";
    case "css":
      return "css";
    case "html":
      return "html";
    case "md":
      return "markdown";
    case "yml":
    case "yaml":
      return "yaml";
    case "py":
      return "python";
    case "sh":
      return "shell";
    default:
      return "plaintext";
  }
}
