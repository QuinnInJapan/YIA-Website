import { createImageUrlBuilder } from "@sanity/image-url";
import { client } from "./client";
import { projectId, dataset } from "./client";
import type { SanityImage, SanityFile, Document } from "@/lib/types";
import { attachmentAssetUrl } from "../attachment-types";

const builder = createImageUrlBuilder(client);

export function urlFor(source: { asset: { _ref: string } }) {
  return builder.image(source);
}

/** Convert a SanityImage to a CDN URL string. Returns "" if no asset.
 *  Requests high-quality auto-format delivery from the Sanity CDN. */
export function imageUrl(image: SanityImage | undefined | null): string {
  if (!image?.asset?._ref) return "";
  return builder.image(image).auto("format").quality(90).url();
}

/** Generate a tiny low-quality placeholder URL for an image (20px wide, quality 20). */
export function imageLqip(image: SanityImage | undefined | null): string {
  if (!image?.asset?._ref) return "";
  return builder.image(image).width(20).quality(20).auto("format").blur(10).url();
}

/** Resolve both image and file references used by attachment fields. */
export function fileUrl(file: SanityFile | undefined | null): string {
  return attachmentAssetUrl(file?.asset?._ref, projectId, dataset);
}

/** Convert a SanityImage hotspot to a CSS object-position string.
 *  Hotspot x/y are 0–1 fractions from top-left. Returns undefined if no hotspot. */
export function hotspotPosition(image: SanityImage | undefined | null): string | undefined {
  if (!image?.hotspot) return undefined;
  return `${Math.round(image.hotspot.x * 100)}% ${Math.round(image.hotspot.y * 100)}%`;
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
