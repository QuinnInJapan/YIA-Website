import type { SanityClient } from "@sanity/client";
import type { DocumentPairIds } from "../shared/draft-documents";

export async function deleteAnnouncement(
  client: SanityClient,
  { publishedId, draftId }: DocumentPairIds,
) {
  const homepages = await client.fetch<Array<{ _id: string; _rev: string }>>(
    '*[_type == "homepage" && references($ids)]{_id, _rev}',
    { ids: [publishedId, draftId] },
    { perspective: "raw" },
  );
  const transaction = client.transaction();
  for (const homepage of homepages) {
    transaction.patch(homepage._id, (patch) =>
      patch
        .ifRevisionId(homepage._rev)
        .unset([
          `announcementRefs[_ref==${JSON.stringify(publishedId)}]`,
          `announcementRefs[_ref==${JSON.stringify(draftId)}]`,
        ]),
    );
  }
  // Remove legacy homepage references and both versions together, or change nothing.
  await transaction.delete(draftId).delete(publishedId).commit();
}
