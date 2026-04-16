import Link from "next/link";
import { auth } from "@/auth";
import { Sparkles, Users, Rocket, Wrench } from "lucide-react";

export default async function Home() {
  const session = await auth();
  return (
    <main className="flex-1 flex flex-col">
      <section className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-12">
        <div className="max-w-3xl text-center space-y-6">
          <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-zinc-400 px-2.5 py-1 rounded-full border border-zinc-800 bg-zinc-900/60">
            <Sparkles className="size-3 text-blue-400" />
            Phase 3 — collaborative agentic IDE
          </span>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
            Build software{" "}
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              by describing it
            </span>
            .
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Agentic Software Platform is a browser-native IDE where you and AI
            agents build full-stack apps together — synthesizing code, running
            it sandboxed, and shipping live previews in real time.
          </p>
          <div className="flex flex-wrap gap-3 justify-center pt-2">
            {session?.user ? (
              <Link
                href="/projects"
                className="px-5 py-2.5 rounded-md bg-white text-black font-medium hover:bg-zinc-200 transition"
              >
                Open workspace
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
      </section>

      <section className="px-6 pb-24 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FeatureCard
            icon={<Wrench className="size-4 text-amber-400" />}
            title="Agentic code synthesis"
            body="GPT-4o ReAct agent with file, search, and install tools edits your project from natural language."
          />
          <FeatureCard
            icon={<Users className="size-4 text-blue-400" />}
            title="Real-time collaboration"
            body="Yjs CRDTs sync every keystroke between humans and agents, with live cursors and presence."
          />
          <FeatureCard
            icon={<Rocket className="size-4 text-emerald-400" />}
            title="Sandbox to deploy"
            body="Run inside a WebContainer, then ship to a public URL with one click."
          />
        </div>
      </section>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      <p className="text-sm text-zinc-400 leading-relaxed">{body}</p>
    </div>
  );
}
