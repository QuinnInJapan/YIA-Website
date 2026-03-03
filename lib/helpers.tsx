import React from "react";

/** Convert \n to React nodes with <br /> */
export function Nl2br({ text }: { text: string }) {
  if (!text) return null;
  const parts = String(text).split("\n");
  return (
    <>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {i > 0 && <br />}
          {part}
        </React.Fragment>
      ))}
    </>
  );
}

/** Generate a section ID from heading text */
export function tocId(text: string): string {
  return `sec-${text.replace(/\s+/g, "-")}`;
}
