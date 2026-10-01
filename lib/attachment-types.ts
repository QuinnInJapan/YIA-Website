/** Formats supported by the attachment picker and public links. */
export const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "avif"];
export const DOCUMENT_EXTENSIONS = ["doc", "docx", "xls", "xlsx", "ppt", "pptx", "csv", "txt"];
export const ATTACHMENT_EXTENSIONS = ["pdf", ...IMAGE_EXTENSIONS, ...DOCUMENT_EXTENSIONS];
export type AttachmentFilter = "images" | "pdf" | "docs" | "all";

export function attachmentExtensions(filter: AttachmentFilter = "all"): string[] {
  if (filter === "images") return IMAGE_EXTENSIONS;
  if (filter === "pdf") return ["pdf"];
  if (filter === "docs") return DOCUMENT_EXTENSIONS;
  return ATTACHMENT_EXTENSIONS;
}

export function attachmentAccept(filter: AttachmentFilter = "all"): string {
  return attachmentExtensions(filter)
    .map((ext) => `.${ext}`)
    .join(",");
}

const MIME_TYPES: Record<string, string[]> = {
  pdf: ["application/pdf"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  png: ["image/png"],
  gif: ["image/gif"],
  webp: ["image/webp"],
  avif: ["image/avif"],
  doc: ["application/msword"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  xls: ["application/vnd.ms-excel"],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  ppt: ["application/vnd.ms-powerpoint"],
  pptx: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  csv: ["text/csv", "application/vnd.ms-excel", "text/plain"],
  txt: ["text/plain"],
};

export function supportedAttachment(
  file: { name: string; type: string },
  filter: AttachmentFilter = "all",
): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return (
    attachmentExtensions(filter).includes(ext) &&
    (!file.type || file.type === "application/octet-stream" || MIME_TYPES[ext]?.includes(file.type))
  );
}

/** Image assets and file assets use different Sanity CDN paths. */
export function attachmentAssetUrl(
  ref: string | undefined,
  projectId: string,
  dataset: string,
): string {
  if (!ref) return "";
  const image = ref.match(/^image-([a-zA-Z0-9]+)-(\d+x\d+)-([a-zA-Z0-9]+)$/);
  if (image)
    return `https://cdn.sanity.io/images/${projectId}/${dataset}/${image[1]}-${image[2]}.${image[3]}`;
  const file = ref.match(/^file-([a-zA-Z0-9]+)-([a-zA-Z0-9]+)$/);
  return file ? `https://cdn.sanity.io/files/${projectId}/${dataset}/${file[1]}.${file[2]}` : "";
}
