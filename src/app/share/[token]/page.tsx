import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ShareLandingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=/share/${token}`);
  }

  const share = await prisma.shareToken.findUnique({
    where: { token },
  });

  if (!share || share.revokedAt) {
    return (
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-2">
          <h1 className="text-xl font-semibold">Invalid invite</h1>
          <p className="text-sm text-zinc-400">
            This share link has been revoked or never existed.
          </p>
        </div>
      </main>
    );
  }
  if (share.expiresAt && share.expiresAt < new Date()) {
    return (
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-2">
          <h1 className="text-xl font-semibold">Invite expired</h1>
          <p className="text-sm text-zinc-400">Ask the project owner for a fresh link.</p>
        </div>
      </main>
    );
  }

  const project = await prisma.project.findUnique({
    where: { id: share.projectId },
  });
  if (!project) {
    return (
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-2">
          <h1 className="text-xl font-semibold">Project not found</h1>
        </div>
      </main>
    );
  }

  if (project.ownerId === session.user.id) {
    redirect(`/ide/${project.id}`);
  }

  await prisma.projectMember.upsert({
    where: {
      projectId_userId: { projectId: project.id, userId: session.user.id },
    },
    update: {},
    create: {
      projectId: project.id,
      userId: session.user.id,
      role: share.role,
    },
  });

  redirect(`/ide/${project.id}`);
}
