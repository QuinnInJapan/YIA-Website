"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useClient } from "sanity";
import { Flex } from "@sanity/ui";
import createImageUrlBuilder from "@sanity/image-url";
import { fs } from "@/sanity/lib/studioTokens";
import {
  EditorProvider,
  PortableTextEditable,
  defineSchema,
  useEditor,
  useEditorSelector,
  type PortableTextBlock,
  type RenderDecoratorFunction,
  type RenderStyleFunction,
  type RenderBlockFunction,
  type RenderListItemFunction,
} from "@portabletext/editor";
import type { GalleryImageItem } from "./GalleryPanel";

// ── PTE Schema ───────────────────────────────────────────

export const pteSchema = defineSchema({
  decorators: [{ name: "strong" }, { name: "em" }],
  styles: [{ name: "normal" }, { name: "h2" }, { name: "h3" }, { name: "h4" }],
  annotations: [{ name: "link", fields: [{ name: "href", type: "string" }] }],
  lists: [{ name: "bullet" }, { name: "number" }],
  blockObjects: [
    {
      name: "image",
      fields: [
        { name: "asset", type: "object" },
        { name: "alt", type: "string" },
        { name: "hotspot", type: "object" },
        { name: "crop", type: "object" },
      ],
    },
    {
      name: "callout",
      fields: [
        { name: "tone", type: "string" },
        { name: "body", type: "string" },
      ],
    },
    {
      name: "youtube",
      fields: [
        { name: "url", type: "string" },
        { name: "caption", type: "string" },
      ],
    },
    {
      name: "inlineGallery",
      fields: [{ name: "images", type: "array" }],
    },
  ],
});

// ── PTE Render functions ─────────────────────────────────

const renderDecorator: RenderDecoratorFunction = (props) => {
  if (props.value === "strong") return <span style={{ fontWeight: 700 }}>{props.children}</span>;
  if (props.value === "em") return <span style={{ fontStyle: "italic" }}>{props.children}</span>;
  return <>{props.children}</>;
};

const renderStyle: RenderStyleFunction = (props) => {
  switch (props.value) {
    case "h2":
      return <h2 className="pte-h2">{props.children}</h2>;
    case "h3":
      return (
        <h3
          style={{
            fontSize: 18 /* intentional: h3 render size */,
            fontWeight: 700,
            margin: "1.5em 0 0.4em",
          }}
        >
          {props.children}
        </h3>
      );
    case "h4":
      return (
        <h4
          style={{
            fontSize: 15 /* intentional: h4 render size */,
            fontWeight: 700,
            margin: "1em 0 0.3em",
          }}
        >
          {props.children}
        </h4>
      );
    default:
      return <p style={{ margin: "0.8em 0" }}>{props.children}</p>;
  }
};

function RemoveBlockButton({
  blockKey,
  onRemove,
}: {
  blockKey: string;
  onRemove: (key: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onRemove(blockKey);
      }}
      style={{
        position: "absolute",
        top: 6,
        right: 6,
        width: 28,
        height: 28,
        borderRadius: 14,
        border: "none",
        background: "rgba(0,0,0,0.55)",
        color: "#fff",
        fontSize: fs.body,
        lineHeight: "28px",
        textAlign: "center",
        cursor: "pointer",
        padding: 0,
      }}
      title="画像を削除"
    >
      ✕
    </button>
  );
}

const renderListItem: RenderListItemFunction = (props) => {
  return <li style={{ margin: "0.3em 0", paddingLeft: "0.25em" }}>{props.children}</li>;
};

// ── Style definitions ────────────────────────────────────

const BLOCK_STYLES: { value: string; label: string; style: React.CSSProperties }[] = [
  {
    value: "normal",
    label: "本文",
    style: { fontSize: 15 /* intentional: rich text block type size */, fontWeight: 400 },
  },
  {
    value: "h2",
    label: "大見出し",
    style: { fontSize: 22 /* intentional: rich text block type size */, fontWeight: 700 },
  },
  {
    value: "h3",
    label: "中見出し",
    style: { fontSize: 18 /* intentional: rich text block type size */, fontWeight: 700 },
  },
  {
    value: "h4",
    label: "小見出し",
    style: { fontSize: 15 /* intentional: rich text block type size */, fontWeight: 700 },
  },
];

// ── Style Dropdown ───────────────────────────────────────

function StyleDropdown() {
  const editor = useEditor();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Detect current block style from focused block
  const activeStyle = useEditorSelector(editor, (s) => {
    if (!s.context.selection) return "normal";
    const anchorKey = s.context.selection.anchor.path[0];
    if (typeof anchorKey !== "object" || !("_key" in anchorKey)) return "normal";
    const idx = s.blockIndexMap.get(anchorKey._key);
    if (idx === undefined) return "normal";
    const block = s.context.value[idx];
    return (block && "style" in block ? (block.style as string) : "normal") ?? "normal";
  });

  const current = BLOCK_STYLES.find((s) => s.value === activeStyle) ?? BLOCK_STYLES[0];

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          setOpen((o) => !o);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 10px",
          border: "1px solid var(--card-border-color)",
          borderRadius: 4,
          background: "transparent",
          cursor: "pointer",
          fontSize: current.style.fontSize ? Math.min(current.style.fontSize as number, 14) : 14,
          fontWeight: current.style.fontWeight ?? 400,
          color: "var(--card-fg-color)",
          minWidth: 120,
        }}
      >
        <span style={{ flex: 1, textAlign: "left" }}>{current.label}</span>
        <span style={{ fontSize: fs.meta, opacity: 0.6 }}>▼</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 10,
            background: "var(--card-bg-color)",
            border: "1px solid var(--card-border-color)",
            borderRadius: 6,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            minWidth: 200,
            overflow: "hidden",
          }}
        >
          {BLOCK_STYLES.map((item) => (
            <button
              key={item.value}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                editor.send({ type: "style.toggle", style: item.value });
                setOpen(false);
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "8px 14px",
                border: "none",
                background: item.value === activeStyle ? "var(--card-border-color)" : "transparent",
                cursor: "pointer",
                fontSize: item.style.fontSize,
                fontWeight: item.style.fontWeight,
                lineHeight: 1.3,
                color: "var(--card-fg-color)",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Toolbar icon components ──────────────────────────────

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

function IconImage() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect
        x="1.5"
        y="2.5"
        width="13"
        height="11"
        rx="1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <circle cx="5.5" cy="6" r="1.5" />
      <path
        d="M1.5 11.5 5 8l2.5 2.5L10 8l4.5 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconGallery() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
    >
      <rect x="1" y="1" width="6" height="6" rx="1" />
      <rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  );
}

// ── PTE Toolbar ──────────────────────────────────────────

const TOOLBAR_BTN: React.CSSProperties = {
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

const TOOLBAR_BTN_ACTIVE: React.CSSProperties = {
  ...TOOLBAR_BTN,
  background: "var(--card-border-color)",
  borderColor: "var(--card-border-color)",
};

const DIVIDER: React.CSSProperties = {
  width: 1,
  alignSelf: "stretch",
  background: "var(--card-border-color)",
  margin: "4px 4px",
};

function PteToolbar({
  onInsertImage,
  onInsertGallery,
}: {
  onInsertImage?: () => void;
  onInsertGallery?: () => void;
}) {
  const editor = useEditor();

  const isStrong = useEditorSelector(editor, (s) => s.decoratorState["strong"] ?? false);
  const isEm = useEditorSelector(editor, (s) => s.decoratorState["em"] ?? false);

  return (
    <Flex
      align="center"
      gap={1}
      paddingBottom={2}
      style={{
        borderBottom: "1px solid var(--card-border-color)",
        marginBottom: 8,
        flexShrink: 0,
      }}
    >
      <StyleDropdown />
      <span style={DIVIDER} />
      <button
        type="button"
        style={isStrong ? TOOLBAR_BTN_ACTIVE : TOOLBAR_BTN}
        onMouseDown={(e) => {
          e.preventDefault();
          editor.send({ type: "decorator.toggle", decorator: "strong" });
        }}
        title="太字 (⌘B)"
      >
        <IconBold />
      </button>
      <button
        type="button"
        style={isEm ? TOOLBAR_BTN_ACTIVE : TOOLBAR_BTN}
        onMouseDown={(e) => {
          e.preventDefault();
          editor.send({ type: "decorator.toggle", decorator: "em" });
        }}
        title="斜体 (⌘I)"
      >
        <IconItalic />
      </button>
      <span style={DIVIDER} />
      <button
        type="button"
        style={TOOLBAR_BTN}
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
        style={TOOLBAR_BTN}
        onMouseDown={(e) => {
          e.preventDefault();
          editor.send({ type: "list item.toggle", listItem: "number" });
        }}
        title="番号付き"
      >
        <IconNumberList />
      </button>
      <span style={DIVIDER} />
      <button
        type="button"
        style={TOOLBAR_BTN}
        disabled={!onInsertImage}
        onMouseDown={(e) => {
          e.preventDefault();
          onInsertImage?.();
        }}
        title="画像を挿入"
      >
        <IconImage />
      </button>
      <button
        type="button"
        style={TOOLBAR_BTN}
        disabled={!onInsertGallery}
        onMouseDown={(e) => {
          e.preventDefault();
          onInsertGallery?.();
        }}
        title="ギャラリーを挿入"
      >
        <IconGallery />
      </button>
    </Flex>
  );
}

// ── PTE Value Watcher ────────────────────────────────────

function PteValueWatcher({ onChange }: { onChange: (value: PortableTextBlock[]) => void }) {
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

// ── Image inserter hook (lives inside EditorProvider) ─────

function useInsertImage(onOpenImagePicker: (onSelect: (assetId: string) => void) => void) {
  const editor = useEditor();

  const openPicker = useCallback(() => {
    onOpenImagePicker((assetId: string) => {
      editor.send({
        type: "insert.block object",
        blockObject: {
          name: "image",
          value: {
            asset: { _type: "reference", _ref: assetId },
          },
        },
        placement: "auto",
      });
    });
  }, [editor, onOpenImagePicker]);

  return { openPicker };
}

// ── Gallery inserter hook (lives inside EditorProvider) ────

function useInsertGallery() {
  const editor = useEditor();

  const insertGallery = useCallback(() => {
    editor.send({
      type: "insert.block object",
      blockObject: {
        name: "inlineGallery",
        value: { images: [] },
      },
      placement: "auto",
    });
  }, [editor]);

  return { insertGallery };
}

// ── Body Editor ──────────────────────────────────────────

export function BodyEditor({
  initialValue,
  onChange,
  onOpenImagePicker,
  onOpenGalleryEditor,
  activeGalleryBlockKey,
  onDeselectGallery,
  readOnly,
}: {
  initialValue: PortableTextBlock[];
  onChange: (value: PortableTextBlock[]) => void;
  onOpenImagePicker: (onSelect: (assetId: string) => void) => void;
  onOpenGalleryEditor: (
    blockKey: string,
    images: GalleryImageItem[],
    onUpdate: (images: GalleryImageItem[]) => void,
  ) => void;
  activeGalleryBlockKey: string | null;
  onDeselectGallery: () => void;
  readOnly?: boolean;
}) {
  const client = useClient({ apiVersion: "2024-01-01" });
  const builder = useMemo(() => createImageUrlBuilder(client), [client]);

  // Track current value so removeBlock can filter from latest state
  const valueRef = useRef(initialValue);
  const [editorKey, setEditorKey] = useState(0);

  const config = useMemo(
    () => ({
      schemaDefinition: pteSchema,
      initialValue: valueRef.current.length > 0 ? valueRef.current : undefined,
    }),
    // Remount editor when key changes (e.g. after block removal)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editorKey],
  );

  const wrappedOnChange = useCallback(
    (value: PortableTextBlock[]) => {
      valueRef.current = value;
      onChange(value);
    },
    [onChange],
  );

  const removeBlock = useCallback(
    (key: string) => {
      const next = valueRef.current.filter((b) => b._key !== key);
      valueRef.current = next;
      onChange(next);
      setEditorKey((k) => k + 1);
    },
    [onChange],
  );

  // Gallery overrides: allows updating gallery images without remounting the PTE
  const galleryMapRef = useRef(new Map<string, GalleryImageItem[]>());

  // Clean up empty gallery blocks when gallery editor closes
  const prevGalleryKeyRef = useRef<string | null>(null);
  useEffect(() => {
    const prevKey = prevGalleryKeyRef.current;
    prevGalleryKeyRef.current = activeGalleryBlockKey;
    // When transitioning from active → inactive, check if the gallery was empty
    if (prevKey && !activeGalleryBlockKey) {
      const overrideImages = galleryMapRef.current.get(prevKey);
      const block = valueRef.current.find((b) => b._key === prevKey);
      const blockImages = block
        ? ((block as unknown as Record<string, unknown>)?.images as GalleryImageItem[] | undefined)
        : undefined;
      const images = overrideImages ?? blockImages ?? [];
      if (images.length === 0) {
        removeBlock(prevKey);
        galleryMapRef.current.delete(prevKey);
      }
    }
  }, [activeGalleryBlockKey, removeBlock]);
  const [galleryVersion, setGalleryVersion] = useState(0);

  const updateGalleryImages = useCallback(
    (blockKey: string, images: GalleryImageItem[]) => {
      // Update the override map (renderBlock reads from this)
      galleryMapRef.current.set(blockKey, images);
      setGalleryVersion((v) => v + 1);
      // Also update valueRef + notify parent so save works
      const next = valueRef.current.map((b) =>
        b._key === blockKey ? ({ ...b, images } as unknown as PortableTextBlock) : b,
      );
      valueRef.current = next;
      onChange(next);
    },
    [onChange],
  );

  // Ref to avoid stale closure when gallery editor callback fires
  const updateGalleryImagesRef = useRef(updateGalleryImages);
  updateGalleryImagesRef.current = updateGalleryImages;

  const renderBlock: RenderBlockFunction = useCallback(
    (props) => {
      const selected = props.selected;
      const selectionRing: React.CSSProperties = selected
        ? {
            outline: "2px solid var(--card-focus-ring-color, #4a90d9)",
            outlineOffset: 2,
            borderRadius: 4,
          }
        : {};

      if (props.schemaType.name === "image") {
        const asset = (props.value as Record<string, unknown>)?.asset as
          | { _ref?: string }
          | undefined;
        const blockKey = (props.value as Record<string, unknown>)?._key as string | undefined;
        if (asset?._ref) {
          const url = builder.image(asset._ref).width(800).auto("format").url();
          return (
            <div style={{ margin: "1em 0", position: "relative", ...selectionRing }}>
              <img
                src={url}
                alt=""
                style={{
                  display: "block",
                  maxWidth: "100%",
                  borderRadius: 6,
                }}
              />
              {!readOnly && blockKey && (
                <RemoveBlockButton blockKey={blockKey} onRemove={removeBlock} />
              )}
            </div>
          );
        }
        return (
          <div
            style={{
              margin: "8px 0",
              padding: 16,
              borderRadius: 6,
              border: "1px dashed var(--card-border-color)",
              textAlign: "center",
              color: "var(--card-muted-fg-color)",
              fontSize: fs.body,
              ...selectionRing,
            }}
          >
            画像（未設定）
          </div>
        );
      }
      if (props.schemaType.name === "callout") {
        const tone = ((props.value as Record<string, unknown>)?.tone as string) ?? "info";
        const body = ((props.value as Record<string, unknown>)?.body as string) ?? "";
        const toneColors: Record<string, string> = {
          info: "#e8f0fe",
          warning: "#fef7e0",
          tip: "#e6f4ea",
        };
        return (
          <div
            style={{
              margin: "8px 0",
              padding: "10px 14px",
              borderRadius: 6,
              background: toneColors[tone] ?? toneColors.info,
              fontSize: fs.body,
              lineHeight: 1.5,
              ...selectionRing,
            }}
          >
            {body || "コールアウト（空）"}
          </div>
        );
      }
      if (props.schemaType.name === "youtube") {
        const url = ((props.value as Record<string, unknown>)?.url as string) ?? "";
        return (
          <div
            style={{
              margin: "8px 0",
              padding: "10px 14px",
              borderRadius: 6,
              background: "var(--card-border-color)",
              fontSize: fs.body,
              ...selectionRing,
            }}
          >
            ▶ YouTube: {url || "（URL未設定）"}
          </div>
        );
      }
      if (props.schemaType.name === "inlineGallery") {
        const blockKey = (props.value as Record<string, unknown>)?._key as string | undefined;
        // Use gallery override if available, otherwise fall back to block value
        const rawImages =
          ((props.value as Record<string, unknown>)?.images as GalleryImageItem[]) ?? [];
        const images =
          blockKey && galleryMapRef.current.has(blockKey)
            ? galleryMapRef.current.get(blockKey)!
            : rawImages;

        const isActive = blockKey === activeGalleryBlockKey;

        function handleOpenEditor() {
          if (!blockKey) return;
          onOpenGalleryEditor(blockKey, images, (newImages: GalleryImageItem[]) => {
            updateGalleryImagesRef.current(blockKey, newImages);
          });
        }

        return (
          <div
            onClick={
              !readOnly
                ? (e) => {
                    e.stopPropagation();
                    handleOpenEditor();
                  }
                : undefined
            }
            style={{
              margin: "1em 0",
              padding: 12,
              borderRadius: 6,
              border: isActive
                ? "2px solid var(--card-focus-ring-color, #4a90d9)"
                : "1px solid var(--card-border-color)",
              background: "var(--card-border-color)",
              position: "relative",
              cursor: readOnly ? undefined : "pointer",
              ...selectionRing,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: images.length > 0 ? 10 : 0,
                fontSize: fs.body,
                fontWeight: 600,
                color: "var(--card-fg-color)",
              }}
            >
              <span>ギャラリー（{images.length > 0 ? `${images.length}枚` : "画像なし"}）</span>
            </div>

            {/* Delete button */}
            {!readOnly && blockKey && (
              <RemoveBlockButton blockKey={blockKey} onRemove={removeBlock} />
            )}

            {/* Thumbnail grid */}
            {images.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                  gap: 6,
                }}
              >
                {images.map((img) => {
                  const ref = img.file?.asset?._ref;
                  if (!ref) return null;
                  return (
                    <div
                      key={img._key}
                      style={{
                        aspectRatio: "1",
                        borderRadius: 4,
                        overflow: "hidden",
                        background: "#e0e0e0",
                      }}
                    >
                      <img
                        src={builder
                          .image(ref)
                          .width(200)
                          .height(200)
                          .fit("crop")
                          .auto("format")
                          .url()}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      }
      return <>{props.children}</>;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [builder, readOnly, removeBlock, onOpenGalleryEditor, galleryVersion, activeGalleryBlockKey],
  );

  // Shrink + fade the drag ghost for block objects
  const handleDragStart = useCallback((e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    // Find the closest block-level element being dragged
    const block = target.closest("[data-testid], [contenteditable]") ?? target;
    const clone = block.cloneNode(true) as HTMLElement;
    clone.style.width = `${block.clientWidth * 0.5}px`;
    clone.style.transform = "scale(0.5)";
    clone.style.transformOrigin = "top left";
    clone.style.opacity = "0.6";
    clone.style.position = "absolute";
    clone.style.top = "-9999px";
    document.body.appendChild(clone);
    e.dataTransfer.setDragImage(clone, 0, 0);
    requestAnimationFrame(() => document.body.removeChild(clone));
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <EditorProvider key={editorKey} initialConfig={config}>
        <BodyEditorInner
          renderBlock={renderBlock}
          handleDragStart={handleDragStart}
          onChange={wrappedOnChange}
          onOpenImagePicker={onOpenImagePicker}
          onDeselectGallery={onDeselectGallery}
          readOnly={readOnly}
        />
      </EditorProvider>
    </div>
  );
}

function BodyEditorInner({
  renderBlock,
  handleDragStart,
  onChange,
  onOpenImagePicker,
  onDeselectGallery,
  readOnly,
}: {
  renderBlock: RenderBlockFunction;
  handleDragStart: (e: React.DragEvent) => void;
  onChange: (value: PortableTextBlock[]) => void;
  onOpenImagePicker: (onSelect: (assetId: string) => void) => void;
  onDeselectGallery: () => void;
  readOnly?: boolean;
}) {
  const { openPicker } = useInsertImage(onOpenImagePicker);
  const { insertGallery } = useInsertGallery();

  return (
    <div>
      <PteToolbar
        onInsertImage={readOnly ? undefined : openPicker}
        onInsertGallery={readOnly ? undefined : insertGallery}
      />
      <div
        onDragStart={readOnly ? undefined : handleDragStart}
        onClick={onDeselectGallery}
        style={{
          minHeight: 300,
          padding: "16px 24px",
          border: "1px solid var(--card-border-color)",
          borderRadius: 4,
          outline: "none",
          fontSize: fs.body,
          lineHeight: 1.8,
          color: "#1a2030",
          opacity: readOnly ? 0.7 : 1,
          pointerEvents: readOnly ? "none" : "auto",
          background: readOnly ? "var(--card-border-color)" : undefined,
        }}
      >
        <style>{`
          .pte-h2 { font-size: 22px; font-weight: 700; margin: 2em 0 0.5em; padding-bottom: 0.3em; border-bottom: 2px solid #eef1f5; }
          .pte-body > :first-child .pte-h2,
          .pte-body > :first-child > :first-child .pte-h2,
          .pte-body > :first-child > :first-child > :first-child .pte-h2 { margin-top: 0; }
        `}</style>
        <PortableTextEditable
          className="pte-body"
          renderDecorator={renderDecorator}
          renderStyle={renderStyle}
          renderBlock={renderBlock}
          renderListItem={renderListItem}
          style={{ outline: "none", minHeight: "100%" }}
        />
      </div>
      {!readOnly && <PteValueWatcher onChange={onChange} />}
    </div>
  );
}
