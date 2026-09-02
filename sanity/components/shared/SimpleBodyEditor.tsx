"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { fs } from "@/sanity/lib/studioTokens";
import {
  EditorProvider,
  PortableTextEditable,
  defineSchema,
  useEditor,
  useEditorSelector,
  type PortableTextBlock,
  type RenderAnnotationFunction,
  type RenderDecoratorFunction,
  type RenderStyleFunction,
  type RenderListItemFunction,
} from "@portabletext/editor";
import * as selectors from "@portabletext/editor/selectors";
import { normalizePortableTextHrefInput } from "@/lib/portable-text-link";
import { RichTextToolbarButton } from "./RichTextToolbarButton";

// ── Schema ───────────────────────────────────────────────

const simpleSchema = defineSchema({
  decorators: [{ name: "strong" }, { name: "em" }],
  styles: [{ name: "normal" }],
  annotations: [{ name: "link", fields: [{ name: "href", type: "string" }] }],
  lists: [{ name: "bullet" }, { name: "number" }],
});

// ── Renderers ────────────────────────────────────────────

const renderDecorator: RenderDecoratorFunction = (props) => {
  if (props.value === "strong") return <span style={{ fontWeight: 700 }}>{props.children}</span>;
  if (props.value === "em") return <span style={{ fontStyle: "italic" }}>{props.children}</span>;
  return <>{props.children}</>;
};

const renderAnnotation: RenderAnnotationFunction = (props) => {
  if (props.schemaType.name !== "link") return <>{props.children}</>;
  const href = typeof props.value?.href === "string" ? props.value.href : "";
  return (
    <span
      title={href}
      style={{ color: "#075985", textDecoration: "underline", textUnderlineOffset: 2 }}
    >
      {props.children}
    </span>
  );
};

const renderStyle: RenderStyleFunction = (props) => (
  <p style={{ margin: "0.6em 0" }}>{props.children}</p>
);

const renderListItem: RenderListItemFunction = (props) => (
  <li style={{ margin: "0.3em 0", marginLeft: "1.4em", listStylePosition: "outside" }}>
    {props.children}
  </li>
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

function IconLink() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6.8 4.2 7.7 3.3a3 3 0 0 1 4.2 4.2l-1.4 1.4a3 3 0 0 1-4.2 0" />
      <path d="M9.2 11.8 8.3 12.7a3 3 0 0 1-4.2-4.2l1.4-1.4a3 3 0 0 1 4.2 0" />
      <path d="M6.5 9.5 9.5 6.5" />
    </svg>
  );
}

// ── Toolbar ──────────────────────────────────────────────

const DIVIDER: React.CSSProperties = {
  width: 1,
  alignSelf: "stretch",
  background: "var(--card-border-color)",
  margin: "4px 4px",
};

function Toolbar() {
  const editor = useEditor();
  const isStrong = useEditorSelector(editor, selectors.isActiveDecorator("strong"));
  const isEm = useEditorSelector(editor, selectors.isActiveDecorator("em"));
  const isBulletList = useEditorSelector(editor, selectors.isActiveListItem("bullet"));
  const isNumberList = useEditorSelector(editor, selectors.isActiveListItem("number"));
  const isLink = useEditorSelector(
    editor,
    selectors.isActiveAnnotation("link", { mode: "partial" }),
  );

  const toggleDecorator = useCallback(
    (decorator: "strong" | "em") => {
      editor.send({ type: "focus" });
      editor.send({ type: "decorator.toggle", decorator });
    },
    [editor],
  );

  const toggleListItem = useCallback(
    (listItem: "bullet" | "number") => {
      editor.send({ type: "focus" });
      editor.send({ type: "list item.toggle", listItem });
    },
    [editor],
  );

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
      <RichTextToolbarButton
        label="太字"
        pressed={isStrong}
        onActivate={() => toggleDecorator("strong")}
      >
        <IconBold />
      </RichTextToolbarButton>
      <RichTextToolbarButton
        label="斜体"
        pressed={isEm}
        onActivate={() => toggleDecorator("em")}
      >
        <IconItalic />
      </RichTextToolbarButton>
      <RichTextToolbarButton
        label="リンク"
        pressed={isLink}
        onActivate={() => {
          if (isLink) {
            editor.send({ type: "annotation.remove", annotation: { name: "link" } });
            editor.send({ type: "focus" });
            return;
          }
          const href = normalizePortableTextHrefInput(window.prompt("リンクURL", "") ?? "");
          if (!href) return;
          editor.send({ type: "annotation.add", annotation: { name: "link", value: { href } } });
          editor.send({ type: "focus" });
        }}
      >
        <IconLink />
      </RichTextToolbarButton>
      <span style={DIVIDER} />
      <RichTextToolbarButton
        label="箇条書き"
        pressed={isBulletList}
        onActivate={() => toggleListItem("bullet")}
      >
        <IconBulletList />
      </RichTextToolbarButton>
      <RichTextToolbarButton
        label="番号付き"
        pressed={isNumberList}
        onActivate={() => toggleListItem("number")}
      >
        <IconNumberList />
      </RichTextToolbarButton>
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
          display: "flex",
          flexDirection: "column",
          padding: "10px 14px",
          border: "1px solid var(--card-border-color)",
          borderRadius: 4,
          fontSize: fs.body,
          fontWeight: 400,
          lineHeight: 1.7,
          color: "var(--card-fg-color)",
          outline: "none",
        }}
      >
        <PortableTextEditable
          renderAnnotation={renderAnnotation}
          renderDecorator={renderDecorator}
          renderStyle={renderStyle}
          renderListItem={renderListItem}
          style={{ outline: "none", flex: 1 }}
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
