import type { ReactNode } from "react";

// Shared by the Studio editors and public Portable Text renderer.
// This red maintains readable contrast on the site's light content backgrounds.
export function RedText({ children }: { children?: ReactNode }) {
  return <span style={{ color: "#b91c1c" }}>{children}</span>;
}

export function RedTextIcon() {
  return (
    <RedText>
      <span aria-hidden="true" style={{ fontWeight: 700 }}>赤</span>
    </RedText>
  );
}
