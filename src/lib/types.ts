export type ProjectFile = {
  id: string;
  path: string;
  contents: string;
  updatedAt?: string;
};

export type ProjectSummary = {
  id: string;
  name: string;
  description: string | null;
  template: string;
  createdAt: string;
  updatedAt: string;
};

export type FileTreeNode = {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileTreeNode[];
};

export type EditorTab = {
  path: string;
  contents: string;
  dirty: boolean;
};
