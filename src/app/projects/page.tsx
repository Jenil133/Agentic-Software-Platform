import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { NewProjectButton } from "@/components/NewProjectButton";

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?callbackUrl=/projects");

  const projects = await prisma.project.findMany({
    where: { ownerId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

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

      {projects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-800 p-12 text-center">
          <p className="text-zinc-400">No projects yet.</p>
          <p className="text-zinc-600 text-sm mt-1">
            Click “New project” above to create your first.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                href={`/ide/${p.id}`}
                className="block rounded-lg border border-zinc-800 hover:border-zinc-600 p-4 transition bg-zinc-900/50"
              >
                <div className="font-medium truncate">{p.name}</div>
                <div className="text-xs text-zinc-500 mt-1">
                  Template: {p.template}
                </div>
                <div className="text-xs text-zinc-600 mt-2">
                  Updated {new Date(p.updatedAt).toLocaleDateString()}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
