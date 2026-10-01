import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StandalonePdfViewer from "@/components/StandalonePdfViewer";
import { safeViewerFileUrl } from "@/lib/document-links";

export const metadata: Metadata = {
  title: "資料ビューア / File Viewer",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{
    file?: string | string[];
    title?: string | string[];
  }>;
}

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function PdfViewerPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const url = safeViewerFileUrl(firstValue(params.file));
  if (!url) notFound();

  const title = firstValue(params.title).trim() || "資料 / File";
  return <StandalonePdfViewer item={{ url, title }} />;
}
