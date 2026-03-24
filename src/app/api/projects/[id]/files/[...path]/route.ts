import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

async function authorize(projectId: string, userId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, ownerId: userId },
  });
}

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string; path: string[] }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id, path: pathSegs } = await ctx.params;
  const project = await authorize(id, session.user.id);
  if (!project) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const path = pathSegs.join("/");
  const body = await req.json().catch(() => ({}));
  const contents = body.contents as string;
  const newPath = (body.newPath as string | undefined)?.trim();

  if (newPath && newPath !== path) {
    await prisma.file.update({
      where: { projectId_path: { projectId: id, path } },
      data: { path: newPath, ...(contents !== undefined ? { contents } : {}) },
    });
  } else {
    await prisma.file.update({
      where: { projectId_path: { projectId: id, path } },
      data: { contents: contents ?? "" },
    });
  }
  await prisma.project.update({
    where: { id },
    data: { updatedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string; path: string[] }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id, path: pathSegs } = await ctx.params;
  const project = await authorize(id, session.user.id);
  if (!project) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const path = pathSegs.join("/");
  await prisma.file.delete({
    where: { projectId_path: { projectId: id, path } },
  });
  return NextResponse.json({ ok: true });
}
