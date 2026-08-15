import React from "react";
export { tocId } from "./toc-id";

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
