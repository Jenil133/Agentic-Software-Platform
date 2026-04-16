import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getProjectAccess } from "@/lib/access";

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
  const project = await prisma.project.findUnique({
    where: { id },
    include: { files: { orderBy: { path: "asc" } } },
  });
  return NextResponse.json({ project, role: access.role });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const access = await getProjectAccess(id, session.user.id);
  if (!access || access.role !== "owner") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
