"use client";

import { useEffect, useRef } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";
import type { editor } from "monaco-editor";
import { useCollab } from "@/lib/collab/provider";

type Props = {
  path: string;
  language: string;
  onChange: (value: string) => void;
};

export default function MonacoEditor({ path, language, onChange }: Props) {
  const { provider, files } = useCollab();
  const bindingRef = useRef<MonacoBinding | null>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const onMount: OnMount = (ed, monaco) => {
    editorRef.current = ed;
    monaco.editor.defineTheme("agentic-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#0a0a0b",
        "editor.lineHighlightBackground": "#18181b",
        "editorGutter.background": "#0a0a0b",
      },
    });
    monaco.editor.setTheme("agentic-dark");
    ed.focus();

    let ytext = files.get(path);
    if (!ytext) {
      ytext = new Y.Text();
      files.set(path, ytext);
    }

    bindingRef.current?.destroy();
    bindingRef.current = new MonacoBinding(
      ytext,
      ed.getModel()!,
      new Set([ed]),
      provider.awareness,
    );

    const updateCursor = () => {
      const pos = ed.getPosition();
      if (!pos) return;
      provider.awareness.setLocalStateField("cursor", {
        path,
        line: pos.lineNumber,
        column: pos.column,
      });
    };
    const sub = ed.onDidChangeCursorPosition(updateCursor);
    updateCursor();

    return () => sub.dispose();
  };

  useEffect(() => {
    return () => {
      bindingRef.current?.destroy();
      bindingRef.current = null;
    };
  }, [path]);

  const initial = files.get(path)?.toString() ?? "";

  return (
    <Editor
      key={path}
      path={path}
      defaultValue={initial}
      language={language}
      onMount={onMount}
      onChange={(v) => onChange(v ?? "")}
      options={{
        fontFamily: "var(--font-geist-mono), Menlo, monospace",
        fontSize: 13,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: "on",
        renderLineHighlight: "all",
      }}
      theme="vs-dark"
    />
  );
}
