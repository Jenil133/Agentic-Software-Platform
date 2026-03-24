import { signIn } from "@/auth";
import { Github } from "lucide-react";

export const dynamic = "force-dynamic";

export default function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  return (
    <main className="flex-1 flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-zinc-800 bg-zinc-900 p-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="text-sm text-zinc-400">
            Use GitHub to access your workspace.
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            const params = await searchParams;
            await signIn("github", {
              redirectTo: params.callbackUrl ?? "/projects",
            });
          }}
        >
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-md bg-white text-black px-4 py-2.5 font-medium hover:bg-zinc-200 transition"
          >
            <Github className="size-4" />
            Continue with GitHub
          </button>
        </form>
        <p className="text-xs text-zinc-500">
          By signing in you agree to our terms.
        </p>
      </div>
    </main>
  );
}
