import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { Workspace } from "@/components/ide/Workspace";

export default async function IDEPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?callbackUrl=/projects");
  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, ownerId: session.user.id },
    include: { files: { orderBy: { path: "asc" } } },
  });
  if (!project) notFound();

  return (
    <Workspace
      project={{
        id: project.id,
        name: project.name,
        template: project.template,
      }}
      files={project.files.map((f) => ({
        id: f.id,
        path: f.path,
        contents: f.contents,
      }))}
    />
  );
}
