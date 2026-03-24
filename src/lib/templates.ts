type TemplateFile = { path: string; contents: string };
export type Template = {
  id: string;
  name: string;
  description: string;
  files: TemplateFile[];
};

export const TEMPLATES: Template[] = [
  {
    id: "blank",
    name: "Blank",
    description: "An empty workspace with just a README.",
    files: [
      {
        path: "README.md",
        contents: "# New Project\n\nStart building.\n",
      },
    ],
  },
  {
    id: "node",
    name: "Node script",
    description: "A minimal Node.js script with package.json.",
    files: [
      {
        path: "package.json",
        contents: JSON.stringify(
          {
            name: "node-script",
            version: "0.1.0",
            type: "module",
            scripts: { start: "node index.js" },
          },
          null,
          2,
        ) + "\n",
      },
      {
        path: "index.js",
        contents: 'console.log("Hello from your sandboxed Node project!");\n',
      },
      { path: "README.md", contents: "# Node script\n\nRun: `npm start`\n" },
    ],
  },
  {
    id: "express",
    name: "Express API",
    description: "A tiny Express server with one route.",
    files: [
      {
        path: "package.json",
        contents: JSON.stringify(
          {
            name: "express-api",
            version: "0.1.0",
            type: "module",
            scripts: { start: "node server.js" },
            dependencies: { express: "^4.21.0" },
          },
          null,
          2,
        ) + "\n",
      },
      {
        path: "server.js",
        contents:
          'import express from "express";\nconst app = express();\napp.get("/", (_req, res) => res.json({ ok: true, message: "Hello from Express!" }));\nconst port = process.env.PORT || 3001;\napp.listen(port, () => console.log(`API on :${port}`));\n',
      },
      {
        path: "README.md",
        contents: "# Express API\n\nRun: `npm install && npm start`\n",
      },
    ],
  },
  {
    id: "vite-react",
    name: "Vite + React",
    description: "A starter Vite + React app.",
    files: [
      {
        path: "package.json",
        contents: JSON.stringify(
          {
            name: "vite-react",
            version: "0.1.0",
            type: "module",
            scripts: {
              dev: "vite",
              build: "vite build",
              preview: "vite preview",
            },
            dependencies: { react: "^18.3.1", "react-dom": "^18.3.1" },
            devDependencies: {
              vite: "^5.4.0",
              "@vitejs/plugin-react": "^4.3.0",
            },
          },
          null,
          2,
        ) + "\n",
      },
      {
        path: "vite.config.js",
        contents:
          'import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\nexport default defineConfig({ plugins: [react()] });\n',
      },
      {
        path: "index.html",
        contents:
          '<!doctype html>\n<html>\n  <head><title>Vite + React</title></head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.jsx"></script>\n  </body>\n</html>\n',
      },
      {
        path: "src/main.jsx",
        contents:
          'import React from "react";\nimport { createRoot } from "react-dom/client";\nfunction App() {\n  return <h1>Hello from Vite + React!</h1>;\n}\ncreateRoot(document.getElementById("root")).render(<App />);\n',
      },
      {
        path: "README.md",
        contents: "# Vite + React\n\nRun: `npm install && npm run dev`\n",
      },
    ],
  },
];

export function getTemplate(id: string): Template {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
