"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

export function RawJsonButton({ getDocument }: { getDocument: () => unknown }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const json = open ? JSON.stringify(getDocument(), null, 2) : "";

  function handleCopy() {
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return createPortal(
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          bottom: 16,
          right: 16,
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "1px solid rgba(128,128,128,0.3)",
          background: "#1a1a1a",
          color: "#999",
          fontSize: 14,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          zIndex: 999999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        title="Raw JSON"
      >
        {"{ }"}
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Backdrop */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
            }}
            onClick={() => setOpen(false)}
          />
          {/* Modal */}
          <div
            style={{
              position: "relative",
              width: "80vw",
              maxWidth: 900,
              maxHeight: "80vh",
              background: "#1a1a1a",
              border: "1px solid rgba(128,128,128,0.3)",
              borderRadius: 8,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 16px",
                borderBottom: "1px solid rgba(128,128,128,0.2)",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: "#e0e0e0" }}>Raw JSON</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={handleCopy}
                  style={{
                    padding: "4px 12px",
                    border: "1px solid rgba(128,128,128,0.3)",
                    borderRadius: 4,
                    background: copied ? "#4caf50" : "transparent",
                    color: copied ? "#fff" : "#e0e0e0",
                    fontSize: 12,
                    cursor: "pointer",
                    transition: "background 150ms, color 150ms",
                  }}
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  style={{
                    padding: "4px 10px",
                    border: "none",
                    borderRadius: 4,
                    background: "transparent",
                    color: "#999",
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
            {/* Body */}
            <pre
              style={{
                flex: 1,
                overflow: "auto",
                margin: 0,
                padding: 16,
                fontSize: 12,
                lineHeight: 1.5,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                color: "#e0e0e0",
              }}
            >
              {json}
            </pre>
          </div>
        </div>
      )}
    </>,
    document.body,
  );
}
