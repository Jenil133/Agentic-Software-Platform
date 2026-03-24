"use client";

import Editor, { type OnMount } from "@monaco-editor/react";

type Props = {
  path: string;
  value: string;
  language: string;
  onChange: (value: string) => void;
};

export default function MonacoEditor({ path, value, language, onChange }: Props) {
  const onMount: OnMount = (editor, monaco) => {
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
    editor.focus();
  };

  return (
    <Editor
      key={path}
      path={path}
      defaultValue={value}
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
