export const ANNOUNCEMENT_PUBLICATION_FIELD_LIST = `
  title, slug, date, pinned, destinationType, targetPage, targetAnchor,
  heroImage, excerpt, body, documents
`;

export const ANNOUNCEMENT_PUBLICATION_PROJECTION = `{
  _id,
  ${ANNOUNCEMENT_PUBLICATION_FIELD_LIST}
}`;

export type AnnouncementPublicationState = "unpublished" | "published" | "published-with-changes";

const PUBLICATION_FIELDS = [
  "title",
  "slug",
  "date",
  "pinned",
  "destinationType",
  "targetPage",
  "targetAnchor",
  "heroImage",
  "excerpt",
  "body",
  "documents",
] as const;

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, child]) => child !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, canonicalize(child)]),
  );
}

function publicationSignature(document: unknown): string | null {
  if (!document || typeof document !== "object") return null;
  const record = document as Record<string, unknown>;
  const content = Object.fromEntries(
    PUBLICATION_FIELDS.map((field) => [field, canonicalize(record[field] ?? null)]),
  );
  return JSON.stringify(content);
}

export function announcementPublicationState(
  publishedDocument: unknown,
  draftDocument: unknown,
): AnnouncementPublicationState {
  const publishedSignature = publicationSignature(publishedDocument);
  const draftSignature = publicationSignature(draftDocument);

  if (!publishedSignature) return "unpublished";
  if (!draftSignature || draftSignature === publishedSignature) return "published";
  return "published-with-changes";
}
