import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const project = await prisma.project.findFirst({
    where: { id, ownerId: session.user.id },
  });
  if (!project) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));
  const path = (body.path as string | undefined)?.trim();
  const contents = (body.contents as string | undefined) ?? "";
  if (!path) {
    return NextResponse.json({ error: "path required" }, { status: 400 });
  }
  const file = await prisma.file.upsert({
    where: { projectId_path: { projectId: id, path } },
    update: { contents },
    create: { projectId: id, path, contents },
  });
  await prisma.project.update({
    where: { id },
    data: { updatedAt: new Date() },
  });
  return NextResponse.json({ file });
}
