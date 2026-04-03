import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { prisma } from "@/lib/db";

export type ToolEvent =
  | { type: "tool_start"; tool: string; args: unknown }
  | { type: "tool_end"; tool: string; result: string }
  | {
      type: "file_change";
      action: "write" | "delete" | "rename";
      path: string;
      newPath?: string;
      contents?: string;
    };

export type ProjectToolContext = {
  projectId: string;
  emit: (event: ToolEvent) => void;
};

export function buildProjectTools(ctx: ProjectToolContext) {
  const list_files = tool(
    async () => {
      const files = await prisma.file.findMany({
        where: { projectId: ctx.projectId },
        select: { path: true },
        orderBy: { path: "asc" },
      });
      return files.map((f) => f.path).join("\n") || "(empty project)";
    },
    {
      name: "list_files",
      description: "List every file path in the current project.",
      schema: z.object({}),
    },
  );

  const read_file = tool(
    async ({ path }) => {
      const file = await prisma.file.findUnique({
        where: { projectId_path: { projectId: ctx.projectId, path } },
      });
      if (!file) return `ERROR: file not found: ${path}`;
      const truncated =
        file.contents.length > 8000
          ? file.contents.slice(0, 8000) + "\n…(truncated)"
          : file.contents;
      return truncated;
    },
    {
      name: "read_file",
      description: "Read the contents of a file by its project-relative path.",
      schema: z.object({
        path: z.string().describe("Project-relative file path"),
      }),
    },
  );

  const write_file = tool(
    async ({ path, contents }) => {
      await prisma.file.upsert({
        where: { projectId_path: { projectId: ctx.projectId, path } },
        update: { contents },
        create: { projectId: ctx.projectId, path, contents },
      });
      await prisma.project.update({
        where: { id: ctx.projectId },
        data: { updatedAt: new Date() },
      });
      ctx.emit({ type: "file_change", action: "write", path, contents });
      return `wrote ${contents.length} bytes to ${path}`;
    },
    {
      name: "write_file",
      description:
        "Create or overwrite a file with the given contents. Use this for any code changes.",
      schema: z.object({
        path: z.string().describe("Project-relative file path"),
        contents: z.string().describe("Full new file contents"),
      }),
    },
  );

  const delete_file = tool(
    async ({ path }) => {
      try {
        await prisma.file.delete({
          where: { projectId_path: { projectId: ctx.projectId, path } },
        });
        ctx.emit({ type: "file_change", action: "delete", path });
        return `deleted ${path}`;
      } catch {
        return `ERROR: could not delete ${path}`;
      }
    },
    {
      name: "delete_file",
      description: "Delete a file from the project.",
      schema: z.object({
        path: z.string().describe("Project-relative file path to delete"),
      }),
    },
  );

  const search_files = tool(
    async ({ query }) => {
      const files = await prisma.file.findMany({
        where: { projectId: ctx.projectId },
        select: { path: true, contents: true },
      });
      const matches: string[] = [];
      const q = query.toLowerCase();
      for (const f of files) {
        const lines = f.contents.split("\n");
        lines.forEach((line, i) => {
          if (line.toLowerCase().includes(q)) {
            matches.push(`${f.path}:${i + 1}: ${line.trim().slice(0, 200)}`);
          }
        });
        if (matches.length > 50) return matches.slice(0, 50).join("\n") + "\n…(truncated)";
      }
      return matches.length ? matches.join("\n") : `(no matches for "${query}")`;
    },
    {
      name: "search_files",
      description:
        "Case-insensitive substring search across all project files. Returns up to 50 file:line matches.",
      schema: z.object({
        query: z.string().describe("Substring to search for"),
      }),
    },
  );

  const install_package = tool(
    async ({ name, dev }) => {
      const pkgFile = await prisma.file.findUnique({
        where: {
          projectId_path: { projectId: ctx.projectId, path: "package.json" },
        },
      });
      if (!pkgFile) {
        return "ERROR: no package.json in project. Use write_file to create one first.";
      }
      let pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
      try {
        pkg = JSON.parse(pkgFile.contents);
      } catch {
        return "ERROR: package.json is not valid JSON";
      }
      const target = dev ? "devDependencies" : "dependencies";
      pkg[target] = pkg[target] ?? {};
      pkg[target]![name] = "latest";
      const next = JSON.stringify(pkg, null, 2) + "\n";
      await prisma.file.update({
        where: {
          projectId_path: { projectId: ctx.projectId, path: "package.json" },
        },
        data: { contents: next },
      });
      ctx.emit({
        type: "file_change",
        action: "write",
        path: "package.json",
        contents: next,
      });
      return `added ${name} to ${target}`;
    },
    {
      name: "install_package",
      description:
        "Add an npm package to package.json. Set dev=true for devDependencies.",
      schema: z.object({
        name: z.string().describe("Package name"),
        dev: z.boolean().default(false).describe("Whether to add as devDependency"),
      }),
    },
  );

  return [
    list_files,
    read_file,
    write_file,
    delete_file,
    search_files,
    install_package,
  ];
}
