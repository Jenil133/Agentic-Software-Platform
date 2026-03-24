"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TEMPLATES } from "@/lib/templates";
import { Plus, Loader2 } from "lucide-react";

export function NewProjectButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [template, setTemplate] = useState("blank");
  const [busy, setBusy] = useState(false);

  async function create() {
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim(), template }),
      });
      const data = await res.json();
      if (data.project?.id) {
        router.push(`/ide/${data.project.id}`);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md bg-white text-black px-3 py-2 text-sm font-medium hover:bg-zinc-200 transition"
      >
        <Plus className="size-4" />
        New project
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h2 className="text-lg font-semibold">New project</h2>
              <p className="text-sm text-zinc-400 mt-1">
                Pick a template to scaffold initial files.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-zinc-500">
                Name
              </label>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="my-awesome-app"
                className="w-full rounded-md bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm focus:outline-none focus:border-zinc-600"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-zinc-500">
                Template
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplate(t.id)}
                    className={`text-left rounded-md border px-3 py-2.5 text-sm transition ${
                      template === t.id
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-zinc-800 hover:border-zinc-600"
                    }`}
                  >
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {t.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-3 py-2 text-sm rounded-md border border-zinc-800 hover:border-zinc-600 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={create}
                disabled={!name.trim() || busy}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-md bg-white text-black hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {busy && <Loader2 className="size-4 animate-spin" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
