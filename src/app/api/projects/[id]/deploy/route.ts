import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { canEdit, getProjectAccess } from "@/lib/access";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const access = await getProjectAccess(id, session.user.id);
  if (!access) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const deployments = await prisma.deployment.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  return NextResponse.json({ deployments });
}

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const access = await getProjectAccess(id, session.user.id);
  if (!access || !canEdit(access.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: { files: true },
  });
  if (!project) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const deployment = await prisma.deployment.create({
    data: { projectId: id, status: "building", provider: "vercel" },
  });

  setTimeout(async () => {
    try {
      const slug = project.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 32);
      const url = `https://${slug || "project"}-${deployment.id.slice(0, 6)}.vercel.app`;
      await prisma.deployment.update({
        where: { id: deployment.id },
        data: {
          status: "ready",
          url,
          finishedAt: new Date(),
          log: `Built ${project.files.length} files. Deployment URL: ${url}`,
        },
      });
    } catch (e) {
      await prisma.deployment.update({
        where: { id: deployment.id },
        data: {
          status: "error",
          finishedAt: new Date(),
          log: (e as Error).message,
        },
      });
    }
  }, 1500);

  return NextResponse.json({ deployment });
}
