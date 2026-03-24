import Link from "next/link";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">
          Agentic Software Platform
        </h1>
        <p className="text-lg text-zinc-400">
          A web-based IDE that builds full-stack applications from natural
          language. AI agents synthesize, edit, and run code in real time —
          collaboratively, in your browser.
        </p>
        <div className="flex gap-3 justify-center pt-4">
          {session?.user ? (
            <Link
              href="/projects"
              className="px-5 py-2.5 rounded-md bg-white text-black font-medium hover:bg-zinc-200 transition"
            >
              Open Workspace
            </Link>
          ) : (
            <Link
              href="/signin"
              className="px-5 py-2.5 rounded-md bg-white text-black font-medium hover:bg-zinc-200 transition"
            >
              Sign in to start
            </Link>
          )}
          <a
            href="https://github.com/Jenil133/Agentic-Software-Platform"
            target="_blank"
            rel="noopener"
            className="px-5 py-2.5 rounded-md border border-zinc-700 hover:border-zinc-500 transition"
          >
            View on GitHub
          </a>
        </div>
      </div>
      <footer className="mt-16 text-xs text-zinc-600">
        Phase 1 — Foundation IDE shell
      </footer>
    </main>
  );
}
