"use client";

import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Text } from "@sanity/ui";

type PreviewMode = "desktop" | "mobile";

const MOBILE_WIDTH = 390;

/**
 * Renders children inside an <iframe> so CSS media queries respond to
 * the preview width rather than the browser viewport.
 */
function PreviewIframe({ children, width }: { children: ReactNode; width: string | number }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mountTarget, setMountTarget] = useState<HTMLElement | null>(null);

  const setup = useCallback(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;

    // Copy all stylesheets from parent into iframe head
    doc.head.innerHTML = "";
    document.querySelectorAll('link[rel="stylesheet"], style').forEach((el) => {
      doc.head.appendChild(el.cloneNode(true));
    });

    // Next.js font loader sets --font-noto via a generated class on <body>.
    // globals.css defines --font-body referencing --font-noto.
    // We need to resolve the actual font-family value and inject it so the
    // iframe's :root has --font-noto available for --font-body to reference.
    const bodyStyle = getComputedStyle(document.body);
    const notoVal = bodyStyle.getPropertyValue("--font-noto").trim();
    if (notoVal) {
      const style = doc.createElement("style");
      style.textContent = `:root { --font-noto: ${notoVal}; }`;
      doc.head.appendChild(style);
    }

    doc.body.style.margin = "0";

    setMountTarget(doc.body);
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // The about:blank iframe may already be ready
    if (iframe.contentDocument?.readyState === "complete") {
      setup();
    }
    iframe.addEventListener("load", setup);
    return () => iframe.removeEventListener("load", setup);
  }, [setup]);

  return (
    <>
      <iframe
        ref={iframeRef}
        style={{
          width,
          height: "100%",
          border: "none",
          display: "block",
        }}
        title="Preview"
      />
      {mountTarget && createPortal(children, mountTarget)}
    </>
  );
}

export function PreviewPanel({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  const [mode, setMode] = useState<PreviewMode>("desktop");

  return (
    <>
      {/* Header */}
      <div
        style={{
          padding: "8px 12px",
          borderBottom: "1px solid var(--card-border-color)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <Text size={0} weight="semibold" muted>
          プレビュー
        </Text>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {/* Desktop / Mobile toggle */}
          <div
            style={{
              display: "flex",
              border: "1px solid var(--card-border-color)",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <button
              type="button"
              onClick={() => setMode("desktop")}
              title="デスクトップ"
              style={{
                padding: "2px 8px",
                border: "none",
                background: mode === "desktop" ? "var(--card-border-color)" : "transparent",
                color: "var(--card-fg-color)",
                fontSize: 11,
                cursor: "pointer",
                lineHeight: 1.5,
              }}
            >
              PC
            </button>
            <button
              type="button"
              onClick={() => setMode("mobile")}
              title="モバイル"
              style={{
                padding: "2px 8px",
                border: "none",
                borderLeft: "1px solid var(--card-border-color)",
                background: mode === "mobile" ? "var(--card-border-color)" : "transparent",
                color: "var(--card-fg-color)",
                fontSize: 11,
                cursor: "pointer",
                lineHeight: 1.5,
              }}
            >
              SP
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="プレビューを閉じる"
            style={{
              padding: "2px 8px",
              border: "1px solid var(--card-border-color)",
              borderRadius: 4,
              background: "transparent",
              color: "var(--card-muted-fg-color)",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            閉じる
          </button>
        </div>
      </div>

      {/* Content: iframe gives its own viewport so media queries work */}
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          justifyContent: "center",
          background: mode === "mobile" ? "var(--card-code-bg-color, #f3f3f6)" : undefined,
        }}
      >
        <PreviewIframe width={mode === "mobile" ? MOBILE_WIDTH : "100%"}>{children}</PreviewIframe>
      </div>
    </>
  );
}
