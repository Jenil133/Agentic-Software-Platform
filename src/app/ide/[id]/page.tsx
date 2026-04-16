import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { Workspace } from "@/components/ide/Workspace";
import { getProjectAccess } from "@/lib/access";

export default async function IDEPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?callbackUrl=/projects");
  const { id } = await params;

  const access = await getProjectAccess(id, session.user.id);
  if (!access) notFound();

  const project = await prisma.project.findUnique({
    where: { id },
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
      currentUser={{
        id: session.user.id,
        name: session.user.name ?? session.user.email ?? "Anonymous",
        image: session.user.image ?? null,
      }}
      role={access.role}
    />
  );
}
