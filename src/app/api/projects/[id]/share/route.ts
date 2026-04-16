import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getProjectAccess } from "@/lib/access";
import { randomBytes } from "node:crypto";

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
  if (!access || access.role !== "owner") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const tokens = await prisma.shareToken.findMany({
    where: { projectId: id, revokedAt: null },
    orderBy: { createdAt: "desc" },
  });
  const members = await prisma.projectMember.findMany({
    where: { projectId: id },
    include: { user: { select: { name: true, email: true, image: true } } },
  });
  return NextResponse.json({ tokens, members });
}

export async function POST(
  req: Request,
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
  const body = await req.json().catch(() => ({}));
  const role = body.role === "viewer" ? "viewer" : "editor";
  const token = randomBytes(20).toString("base64url");
  const created = await prisma.shareToken.create({
    data: {
      token,
      projectId: id,
      createdById: session.user.id,
      role,
    },
  });
  return NextResponse.json({ token: created });
}

export async function DELETE(
  req: Request,
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
  const url = new URL(req.url);
  const tokenId = url.searchParams.get("tokenId");
  if (!tokenId) {
    return NextResponse.json({ error: "tokenId required" }, { status: 400 });
  }
  await prisma.shareToken.update({
    where: { id: tokenId },
    data: { revokedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
