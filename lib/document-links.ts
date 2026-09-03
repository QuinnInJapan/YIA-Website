import type { Document } from "@/lib/types";

function cleanValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function extensionFromUrl(value: unknown): string {
  const url = cleanValue(value).split(/[?#]/, 1)[0];
  return url.match(/\.([a-z0-9]+)$/i)?.[1] ?? "";
}

function extensionFromAssetRef(doc: Document): string {
  const ref = cleanValue(doc.file?.asset?._ref);
  return ref.match(/-([a-z0-9]+)$/i)?.[1] ?? "";
}

export function documentTypeLabel(doc: Document): string {
  const fileType = cleanValue(doc.fileType);
  if (fileType) return fileType.toUpperCase();

  const type = cleanValue(doc.type);
  if (type && type.toLowerCase() !== "document") return type;

  const inferred = extensionFromUrl(doc.url) || extensionFromAssetRef(doc);
  if (inferred) return inferred.toUpperCase();

  return type || "PDF";
}

export function isPdfDocument(doc: Document): boolean {
  return documentTypeLabel(doc).toUpperCase() === "PDF";
}

export function safeViewerFileUrl(value: unknown): string | undefined {
  const url = cleanValue(value);
  if (!url) return undefined;
  if (/^\/(?!\/)/.test(url)) return url;

  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? url : undefined;
  } catch {
    return undefined;
  }
}

export function pdfViewerPath(url: string, title: string): string {
  const safeUrl = safeViewerFileUrl(url);
  if (!safeUrl) return "";

  const params = new URLSearchParams({ file: safeUrl });
  if (title.trim()) params.set("title", title.trim());
  return `/pdf-viewer?${params.toString()}`;
}
