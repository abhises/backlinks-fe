'use client';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { json } from '@codemirror/lang-json';
import type { EditorView } from '@codemirror/view';
import CodeMirror from '@uiw/react-codemirror';
import { useMemo } from 'react';
import a from './adminBlog.module.css';

const LANGS = { html, css, json };

/** CodeMirror code editor (same editor as the BrasQ admin). */
export function CodeField({ lang, value, onChange, readOnly, onView, minHeight = 420 }: {
  lang: keyof typeof LANGS; value: string; onChange?: (v: string) => void; readOnly?: boolean;
  onView?: (v: EditorView) => void; minHeight?: number;
}) {
  const extensions = useMemo(() => [LANGS[lang]()], [lang]);
  return (
    <div className={a.code}>
      <CodeMirror
        value={value}
        extensions={extensions}
        onChange={onChange}
        readOnly={readOnly}
        editable={!readOnly}
        minHeight={`${minHeight}px`}
        onCreateEditor={onView}
        basicSetup={{ foldGutter: true, highlightActiveLine: !readOnly }}
      />
    </div>
  );
}
