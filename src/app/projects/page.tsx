import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { NewProjectButton } from "@/components/NewProjectButton";
import { Users } from "lucide-react";

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?callbackUrl=/projects");

  const owned = await prisma.project.findMany({
    where: { ownerId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });
  const memberships = await prisma.projectMember.findMany({
    where: { userId: session.user.id },
    include: { project: true },
    orderBy: { createdAt: "desc" },
  });
  const shared = memberships.map((m) => ({ ...m.project, role: m.role }));

  return (
    <main className="flex-1 px-6 py-10 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Your projects</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Open a workspace or create a new one from a template.
          </p>
        </div>
        <NewProjectButton />
      </div>

      {owned.length === 0 && shared.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-800 p-12 text-center">
          <p className="text-zinc-400">No projects yet.</p>
          <p className="text-zinc-600 text-sm mt-1">
            Click “New project” above to create your first.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {owned.length > 0 && (
            <section>
              <h2 className="text-xs uppercase tracking-wide text-zinc-500 mb-3">
                Owned by you
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {owned.map((p) => (
                  <ProjectCard key={p.id} project={p} role="owner" />
                ))}
              </ul>
            </section>
          )}
          {shared.length > 0 && (
            <section>
              <h2 className="text-xs uppercase tracking-wide text-zinc-500 mb-3">
                Shared with you
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {shared.map((p) => (
                  <ProjectCard key={p.id} project={p} role={p.role} />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </main>
  );
}

function ProjectCard({
  project,
  role,
}: {
  project: { id: string; name: string; template: string; updatedAt: Date };
  role: string;
}) {
  return (
    <li>
      <Link
        href={`/ide/${project.id}`}
        className="block rounded-lg border border-zinc-800 hover:border-zinc-600 p-4 transition bg-zinc-900/50"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium truncate">{project.name}</span>
          {role !== "owner" && (
            <span className="text-[10px] uppercase tracking-wide text-zinc-500 inline-flex items-center gap-1">
              <Users className="size-3" />
              {role}
            </span>
          )}
        </div>
        <div className="text-xs text-zinc-500 mt-1">
          Template: {project.template}
        </div>
        <div className="text-xs text-zinc-600 mt-2">
          Updated {new Date(project.updatedAt).toLocaleDateString()}
        </div>
      </Link>
    </li>
  );
}
