import { useEffect, useRef } from "react";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { python } from "@codemirror/lang-python";
import { bracketMatching, indentOnInput, syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";

export function CodeEditor({
  value,
  onChange,
  label = "ตัวแก้ไขโค้ด",
}: {
  value: string;
  onChange: (next: string) => void;
  label?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!host.current) return;
    const view = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          history(),
          python(),
          indentOnInput(),
          bracketMatching(),
          syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChangeRef.current(update.state.doc.toString());
          }),
          EditorView.theme({
            "&": { backgroundColor: "var(--bg)", color: "var(--fg)", height: "100%" },
            ".cm-scroller": {
              fontFamily: "var(--font-mono)",
              fontSize: "15px",
              lineHeight: "1.55",
              minHeight: "16rem",
            },
            ".cm-content": { padding: "12px 0" },
            ".cm-gutters": {
              backgroundColor: "var(--surface)",
              color: "var(--muted)",
              border: "none",
            },
            "&.cm-focused": { outline: "none" },
          }),
        ],
      }),
    });
    viewRef.current = view;
    return () => view.destroy();
    // Mount once; external resets flow through the value effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({ changes: { from: 0, to: current.length, insert: value } });
    }
  }, [value]);

  return (
    <div
      ref={host}
      role="group"
      aria-label={label}
      className="min-h-64 overflow-hidden rounded-md border border-line bg-bg"
    />
  );
}
