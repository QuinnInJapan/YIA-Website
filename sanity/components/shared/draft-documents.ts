export interface DocumentPairIds {
  publishedId: string;
  draftId: string;
}

export function documentPairIds(documentId: string): DocumentPairIds {
  const publishedId = documentId.replace(/^drafts\./, "");
  return {
    publishedId,
    draftId: `drafts.${publishedId}`,
  };
}

type SanityDocumentMetadata = {
  _id?: unknown;
  _type?: unknown;
  _rev?: unknown;
  _updatedAt?: unknown;
};

export function draftDocumentForBase<T extends object>(
  baseDoc: T,
  draftId: string,
  type: string,
): T & { _id: string; _type: string } {
  return {
    ...baseDoc,
    _id: draftId,
    _type: type,
  };
}

export function publishedDocumentForDraft<T extends object>(
  source: T,
  publishedId: string,
  type: string,
): Omit<T, "_rev" | "_updatedAt" | "_id" | "_type"> & { _id: string; _type: string } {
  const { _rev, _updatedAt, ...rest } = source as T & SanityDocumentMetadata;
  return {
    ...rest,
    _id: publishedId,
    _type: type,
  } as Omit<T, "_rev" | "_updatedAt" | "_id" | "_type"> & { _id: string; _type: string };
}
