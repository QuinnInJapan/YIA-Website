"use client";

import { useCallback } from "react";
import dynamic from "next/dynamic";
import type { PdfViewerItem } from "./PdfViewer";

const PdfViewer = dynamic(() => import("./PdfViewer"), { ssr: false });

export default function StandalonePdfViewer({ item }: { item: PdfViewerItem }) {
  const handleClose = useCallback(() => {
    window.close();
  }, []);

  const handleNavigate = useCallback(() => {}, []);

  return (
    <PdfViewer
      items={[item]}
      currentIndex={0}
      isOpen
      onClose={handleClose}
      onNavigate={handleNavigate}
    />
  );
}
