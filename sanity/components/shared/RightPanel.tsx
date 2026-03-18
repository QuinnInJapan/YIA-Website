"use client";

export function RightPanel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "50%",
        maxWidth: 800,
        minWidth: 400,
        flexShrink: 0,
        borderLeft: "1px solid var(--card-border-color)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {children}
    </div>
  );
}
