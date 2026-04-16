import { prisma } from "@/lib/db";

export type ProjectAccess = {
  projectId: string;
  userId: string;
  role: "owner" | "editor" | "viewer";
};

export async function getProjectAccess(
  projectId: string,
  userId: string,
): Promise<ProjectAccess | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, ownerId: true },
  });
  if (!project) return null;
  if (project.ownerId === userId) {
    return { projectId, userId, role: "owner" };
  }
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!member) return null;
  return {
    projectId,
    userId,
    role: member.role === "viewer" ? "viewer" : "editor",
  };
}

export function canEdit(role: ProjectAccess["role"]) {
  return role === "owner" || role === "editor";
}
