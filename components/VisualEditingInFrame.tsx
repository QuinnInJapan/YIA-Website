"use client";

import { useEffect, useState } from "react";
import { VisualEditing } from "next-sanity/visual-editing";

/** Only renders VisualEditing overlays when the page is inside an iframe (Presentation tool). */
export default function VisualEditingInFrame() {
  const [inIframe, setInIframe] = useState(false);

  useEffect(() => {
    setInIframe(window.self !== window.top);
  }, []);

  if (!inIframe) return null;
  return <VisualEditing />;
}
