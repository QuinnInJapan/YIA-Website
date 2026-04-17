"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  EditorProvider,
  PortableTextEditable,
  defineSchema,
  useEditor,
  useEditorSelector,
  type PortableTextBlock,
  type RenderDecoratorFunction,
  type RenderStyleFunction,
  type RenderListItemFunction,
} from "@portabletext/editor";

// ── Schema ───────────────────────────────────────────────

const simpleSchema = defineSchema({
  decorators: [{ name: "strong" }, { name: "em" }],
  styles: [{ name: "normal" }],
  lists: [{ name: "bullet" }, { name: "number" }],
});

// ── Renderers ────────────────────────────────────────────

const renderDecorator: RenderDecoratorFunction = (props) => {
  if (props.value === "strong") return <span style={{ fontWeight: 700 }}>{props.children}</span>;
  if (props.value === "em") return <span style={{ fontStyle: "italic" }}>{props.children}</span>;
  return <>{props.children}</>;
};

const renderStyle: RenderStyleFunction = (props) => (
  <p style={{ margin: "0.6em 0" }}>{props.children}</p>
);

const renderListItem: RenderListItemFunction = (props) => (
  <li style={{ margin: "0.3em 0", paddingLeft: "0.25em" }}>{props.children}</li>
);

// ── Toolbar icons ────────────────────────────────────────

function IconBold() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M4 2.5h4.5a3 3 0 0 1 2.1 5.15A3.25 3.25 0 0 1 9 13.5H4V2.5Zm1.5 1.5V7H8a1.5 1.5 0 1 0 0-3H5.5Zm0 4.5V12H9a1.75 1.75 0 1 0 0-3.5H5.5Z" />
    </svg>
  );
}

function IconItalic() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M10 2.5H6.5v1.5h1.34L6.16 12H4.5v1.5H9V12H7.66l1.68-8H11V2.5h-1Z" />
    </svg>
  );
}

function IconBulletList() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="3" cy="4.5" r="1.25" />
      <circle cx="3" cy="8" r="1.25" />
      <circle cx="3" cy="11.5" r="1.25" />
      <rect x="6" y="3.75" width="8" height="1.5" rx=".5" />
      <rect x="6" y="7.25" width="8" height="1.5" rx=".5" />
      <rect x="6" y="10.75" width="8" height="1.5" rx=".5" />
    </svg>
  );
}

function IconNumberList() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <text x="1.5" y="5.5" fontSize="5" fontWeight="700" fontFamily="system-ui">
        1.
      </text>
      <text x="1.5" y="9" fontSize="5" fontWeight="700" fontFamily="system-ui">
        2.
      </text>
      <text x="1.5" y="12.5" fontSize="5" fontWeight="700" fontFamily="system-ui">
        3.
      </text>
      <rect x="6" y="3.75" width="8" height="1.5" rx=".5" />
      <rect x="6" y="7.25" width="8" height="1.5" rx=".5" />
      <rect x="6" y="10.75" width="8" height="1.5" rx=".5" />
    </svg>
  );
}

// ── Toolbar ──────────────────────────────────────────────

const BTN: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 32,
  height: 32,
  border: "1px solid transparent",
  borderRadius: 4,
  background: "transparent",
  cursor: "pointer",
  color: "var(--card-fg-color)",
};

const BTN_ACTIVE: React.CSSProperties = {
  ...BTN,
  background: "var(--card-border-color)",
  borderColor: "var(--card-border-color)",
};

const DIVIDER: React.CSSProperties = {
  width: 1,
  alignSelf: "stretch",
  background: "var(--card-border-color)",
  margin: "4px 4px",
};

function Toolbar() {
  const editor = useEditor();
  const isStrong = useEditorSelector(editor, (s) => s.decoratorState["strong"] ?? false);
  const isEm = useEditorSelector(editor, (s) => s.decoratorState["em"] ?? false);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        paddingBottom: 6,
        borderBottom: "1px solid var(--card-border-color)",
        marginBottom: 6,
      }}
    >
      <button
        type="button"
        style={isStrong ? BTN_ACTIVE : BTN}
        onMouseDown={(e) => {
          e.preventDefault();
          editor.send({ type: "decorator.toggle", decorator: "strong" });
        }}
        title="太字"
      >
        <IconBold />
      </button>
      <button
        type="button"
        style={isEm ? BTN_ACTIVE : BTN}
        onMouseDown={(e) => {
          e.preventDefault();
          editor.send({ type: "decorator.toggle", decorator: "em" });
        }}
        title="斜体"
      >
        <IconItalic />
      </button>
      <span style={DIVIDER} />
      <button
        type="button"
        style={BTN}
        onMouseDown={(e) => {
          e.preventDefault();
          editor.send({ type: "list item.toggle", listItem: "bullet" });
        }}
        title="箇条書き"
      >
        <IconBulletList />
      </button>
      <button
        type="button"
        style={BTN}
        onMouseDown={(e) => {
          e.preventDefault();
          editor.send({ type: "list item.toggle", listItem: "number" });
        }}
        title="番号付き"
      >
        <IconNumberList />
      </button>
    </div>
  );
}

// ── Value watcher ────────────────────────────────────────

function ValueWatcher({ onChange }: { onChange: (value: PortableTextBlock[]) => void }) {
  const editor = useEditor();
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const sub = editor.on("mutation", (event) => {
      if (event.type === "mutation" && event.value) {
        onChangeRef.current(event.value);
      }
    });
    return () => sub.unsubscribe();
  }, [editor]);

  return null;
}

// ── Inner (lives inside EditorProvider) ─────────────────

function Inner({ onChange }: { onChange: (value: PortableTextBlock[]) => void }) {
  return (
    <div>
      <Toolbar />
      <div
        className="simple-body-editor"
        style={{
          minHeight: 120,
          padding: "10px 14px",
          border: "1px solid var(--card-border-color)",
          borderRadius: 4,
          fontSize: 13,
          lineHeight: 1.7,
          color: "var(--card-fg-color)",
          outline: "none",
        }}
      >
        <PortableTextEditable
          renderDecorator={renderDecorator}
          renderStyle={renderStyle}
          renderListItem={renderListItem}
          style={{ outline: "none", minHeight: "100%" }}
        />
      </div>
      <ValueWatcher onChange={onChange} />
    </div>
  );
}

// ── Public component ─────────────────────────────────────

export function SimpleBodyEditor({
  initialValue,
  onChange,
}: {
  initialValue: PortableTextBlock[];
  onChange: (value: PortableTextBlock[]) => void;
}) {
  const config = useMemo(
    () => ({
      schemaDefinition: simpleSchema,
      initialValue: initialValue.length > 0 ? initialValue : undefined,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const handleChange = useCallback(onChange, [onChange]);

  return (
    <EditorProvider initialConfig={config}>
      <Inner onChange={handleChange} />
    </EditorProvider>
  );
}
