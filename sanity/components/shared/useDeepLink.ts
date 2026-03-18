import { useEffect, useState } from "react";

/**
 * Reads and consumes a pending deep-link navigation set by the media browser.
 * Returns the document ID if this tool was the target, then clears it.
 */
export function useDeepLink(toolName: string): string | null {
  const [docId] = useState<string | null>(() => {
    const nav = window.__yiaNavigateTo;
    if (nav?.tool === toolName) {
      window.__yiaNavigateTo = undefined;
      return nav.docId;
    }
    return null;
  });
  return docId;
}

declare global {
  interface Window {
    __yiaNavigateTo?: { tool: string; docId: string };
  }
}
