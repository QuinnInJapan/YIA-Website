import assert from "node:assert/strict";
import test from "node:test";

import {
  documentPairIds,
  draftDocumentForBase,
  publishedDocumentForDraft,
} from "../sanity/components/shared/draft-documents.ts";
import { announcementPublicationState } from "../sanity/components/announcements/publication-state.ts";

test("derives published and draft ids from any Studio document id", () => {
  assert.deepEqual(documentPairIds("page-classes"), {
    publishedId: "page-classes",
    draftId: "drafts.page-classes",
  });
  assert.deepEqual(documentPairIds("drafts.page-classes"), {
    publishedId: "page-classes",
    draftId: "drafts.page-classes",
  });
});

test("builds draft documents without changing existing save payload shape", () => {
  const baseDoc = {
    _id: "page-classes",
    _type: "page",
    _rev: "published-rev",
    _updatedAt: "2026-06-01T00:00:00Z",
    title: "Classes",
  };

  assert.deepEqual(draftDocumentForBase(baseDoc, "drafts.page-classes", "page"), {
    ...baseDoc,
    _id: "drafts.page-classes",
    _type: "page",
  });
});

test("builds published documents by stripping draft-only metadata", () => {
  const draftDoc = {
    _id: "drafts.page-classes",
    _type: "page",
    _rev: "draft-rev",
    _updatedAt: "2026-06-01T00:00:00Z",
    title: "Classes",
  };

  assert.deepEqual(publishedDocumentForDraft(draftDoc, "page-classes", "page"), {
    _id: "page-classes",
    _type: "page",
    title: "Classes",
  });
});

test("distinguishes unpublished announcements from published announcements with changes", () => {
  const published = {
    _id: "announcement-event",
    _rev: "published-rev",
    _updatedAt: "2026-09-01T00:00:00Z",
    title: [{ _key: "ja", value: "イベント" }],
    date: "2026-09-01",
    body: null,
  };

  assert.equal(announcementPublicationState(null, published), "unpublished");
  assert.equal(announcementPublicationState(published, null), "published");
  assert.equal(
    announcementPublicationState(published, {
      ...published,
      _id: "drafts.announcement-event",
      _rev: "draft-rev",
      _updatedAt: "2026-09-02T00:00:00Z",
    }),
    "published",
  );
  assert.equal(
    announcementPublicationState(published, {
      ...published,
      _id: "drafts.announcement-event",
      title: [{ _key: "ja", value: "更新したイベント" }],
    }),
    "published-with-changes",
  );
});
