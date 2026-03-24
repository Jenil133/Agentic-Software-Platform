# Agentic Software Platform

A web-based IDE that lets you build full-stack applications via natural language. Describe what you want, and AI agents synthesize, edit, and run the code in real time — collaboratively, in the browser.

## Highlights

- **Natural-language code synthesis** — agents scaffold and edit full-stack apps from a prompt.
- **Agentic orchestration** with LangChain (planner / coder / reviewer pattern).
- **Real-time collaboration** — multiple humans + AI agents editing the same workspace via WebSockets + CRDTs.
- **Sandboxed execution** in the browser with live preview.
- **One-click deploy** to Vercel / Railway.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS v4 |
| Editor | Monaco Editor |
| AI | GPT-4o, LangChain, LangGraph (Phase 2) |
| Realtime | WebSockets, Yjs CRDT (Phase 3) |
| Backend | Next.js API routes, Prisma ORM |
| Database | SQLite (dev) → Postgres + pgvector (Phase 2) |
| Auth | NextAuth.js v5 with GitHub OAuth |
| Sandbox | WebContainers (StackBlitz) |

## Project Status

Early-stage build, planned across three phases (~4 weeks):

1. **Foundation (current)** — IDE shell, file tree, Monaco editor, sandboxed execution, GitHub auth.
2. **AI Agent Layer** — LangChain agents with file/run tools, codebase indexing, chat-driven code synthesis.
3. **Collaboration & Polish** — Yjs real-time sync, AI agents as collaborators, sharing, deploy pipeline.

## Getting Started

```bash
# Clone
git clone https://github.com/Jenil133/Agentic-Software-Platform.git
cd Agentic-Software-Platform

# Install
npm install

# Configure environment
cp .env.example .env.local
# Fill in DATABASE_URL, AUTH_SECRET, AUTH_GITHUB_ID, AUTH_GITHUB_SECRET

# Initialize the database
npx prisma migrate dev

# Start the dev server
npm run dev
```

Open <http://localhost:3000> and sign in with GitHub.

## What's in Phase 1

- Three-pane IDE workspace with resizable panels (file tree / editor / agent).
- Monaco editor with tabs, dirty-state indicators, `Cmd+S` to save, auto-save on idle (1.5s debounce).
- File tree with create / rename / delete and folder expansion.
- Project lifecycle: create from templates (Blank, Node, Express, Vite + React).
- Output panel + preview iframe wired to a WebContainer sandbox (`Run` button mounts files, runs `npm install`, then `dev` or `start`).
- Agent panel placeholder for Phase 2.
- GitHub OAuth via NextAuth, sessions persisted to SQLite via Prisma adapter.
- COOP/COEP headers on `/ide/*` for WebContainer cross-origin isolation.

## Project Layout

```
prisma/                 # Prisma schema + migrations
src/
  app/                  # Next.js App Router routes
    api/                # REST API for projects + files + auth
    ide/[id]/           # IDE workspace page
    projects/           # Project list page
    signin/             # Auth screen
  components/ide/       # IDE components (Workspace, FileTree, Monaco, panels)
  lib/                  # db, types, file-tree helpers, templates, webcontainer
  auth.ts               # NextAuth config
  middleware.ts         # Route protection
```

## License

TBD
