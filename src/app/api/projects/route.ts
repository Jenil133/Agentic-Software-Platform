import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getTemplate } from "@/lib/templates";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const projects = await prisma.project.findMany({
    where: { ownerId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ projects });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const name = (body.name as string | undefined)?.trim();
  const templateId = (body.template as string | undefined) ?? "blank";

  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const template = getTemplate(templateId);

  const project = await prisma.project.create({
    data: {
      name,
      template: template.id,
      ownerId: session.user.id,
      files: {
        create: template.files.map((f) => ({
          path: f.path,
          contents: f.contents,
        })),
      },
    },
  });

  return NextResponse.json({ project });
}
