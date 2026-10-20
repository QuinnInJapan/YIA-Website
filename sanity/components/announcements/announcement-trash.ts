import type { SanityClient } from "@sanity/client";
import type { DocumentPairIds } from "../shared/draft-documents";

type AnnouncementVersion = { _id: string; _rev: string; trashedAt?: string };

async function fetchVersions(client: SanityClient, ids: DocumentPairIds) {
  return client.fetch<AnnouncementVersion[]>(
    '*[_type == "announcement" && _id in $ids]{_id, _rev, trashedAt}',
    { ids: [ids.publishedId, ids.draftId] },
    { perspective: "raw" },
  );
}

export async function setAnnouncementTrashed(
  client: SanityClient,
  ids: DocumentPairIds,
  trashed: boolean,
) {
  const versions = await fetchVersions(client, ids);
  if (!versions.length) throw new Error("お知らせが見つかりません。再読み込みしてください。");
  const trashedAt = new Date().toISOString();
  const transaction = client.transaction();
  for (const version of versions) {
    transaction.patch(version._id, (patch) => {
      const guarded = patch.ifRevisionId(version._rev);
      return trashed ? guarded.set({ trashedAt }) : guarded.unset(["trashedAt"]);
    });
  }
  // Preserve content, publication state, assets and references for restoration.
  await transaction.commit();
}

export async function publishActiveAnnouncement(
  client: SanityClient,
  ids: DocumentPairIds,
  document: { _id: string; _type: string },
) {
  const versions = await fetchVersions(client, ids);
  if (!versions.length || versions.some((version) => version.trashedAt)) {
    throw new Error("このお知らせはゴミ箱に移動されています。復元してから公開してください。");
  }
  const transaction = client.transaction();
  // A concurrent move to trash must win over a stale editor's publish.
  for (const version of versions) {
    transaction.patch(version._id, (patch) => patch.ifRevisionId(version._rev).set({}));
  }
  if (versions.some((version) => version._id === ids.publishedId)) {
    transaction.createOrReplace(document);
  } else {
    transaction.create(document);
  }
  await transaction.delete(ids.draftId).commit();
}
