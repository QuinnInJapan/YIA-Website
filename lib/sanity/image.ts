import { createImageUrlBuilder } from "@sanity/image-url";
import { client } from "./client";
import { projectId, dataset } from "./client";
import type { SanityImage, SanityFile, Document } from "@/lib/types";

const builder = createImageUrlBuilder(client);

export function urlFor(source: { asset: { _ref: string } }) {
  return builder.image(source);
}

/** Convert a SanityImage to a CDN URL string. Returns "" if no asset. */
export function imageUrl(image: SanityImage | undefined | null): string {
  if (!image?.asset?._ref) return "";
  return builder.image(image).url();
}

/** Convert a SanityFile to a CDN URL string. Returns "" if no asset.
 *  File _ref format: "file-{id}-{ext}" → https://cdn.sanity.io/files/{projectId}/{dataset}/{id}.{ext} */
export function fileUrl(file: SanityFile | undefined | null): string {
  if (!file?.asset?._ref) return "";
  const ref = file.asset._ref;
  // Parse "file-<id>-<ext>" format
  const match = ref.match(/^file-(.+)-(\w+)$/);
  if (!match) return "";
  return `https://cdn.sanity.io/files/${projectId}/${dataset}/${match[1]}.${match[2]}`;
}

/** Resolve document URLs: prefer Sanity file CDN URL, fall back to url string.
 *  Call on the server before passing docs to client components. */
export function resolveDocs(docs: Document[] | undefined): Document[] {
  if (!docs?.length) return [];
  return docs.map((doc) => {
    const resolved = fileUrl(doc.file);
    if (resolved) return { ...doc, url: resolved };
    return doc;
  });
}
