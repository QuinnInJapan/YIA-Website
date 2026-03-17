"use client";

import { useEffect, useState } from "react";
import { VisualEditing } from "next-sanity/visual-editing";

/** Only renders VisualEditing overlays when the page is inside an iframe (Presentation tool). */
export default function VisualEditingInFrame() {
  const [inIframe, setInIframe] = useState(false);

  useEffect(() => {
    setInIframe(window.self !== window.top);
  }, []);

  // Skip overlays for custom tool previews (they pass ?preview param)
  const [isToolPreview, setIsToolPreview] = useState(false);
  useEffect(() => {
    setIsToolPreview(new URLSearchParams(window.location.search).has("preview"));
  }, []);

  if (!inIframe || isToolPreview) return null;
  return <VisualEditing />;
}
