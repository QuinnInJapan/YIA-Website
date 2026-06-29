import assert from "node:assert/strict";
import test from "node:test";

import {
  navigationCategorySegments,
  navigationPageParams,
  navigationRouteGroups,
} from "../lib/sanity/navigation-routes.ts";
import { documentIdSegment } from "../lib/routes.ts";

const navigation = {
  categories: [
    {
      categoryRef: { _id: "category-classes" },
      items: [
        { pageRef: { slug: "conversation-salon" } },
        { hidden: true, pageRef: { slug: "nihongo-handbook" } },
      ],
    },
    {
      categoryRef: { _id: "drafts.category-events" },
      items: [{ pageRef: { slug: "international-fair" } }],
    },
    {
      categoryRef: null,
      items: [{ pageRef: { slug: "orphan-page" } }],
    },
  ],
};

test("derives category route segments from navigation in order", () => {
  assert.deepEqual(navigationCategorySegments(navigation, documentIdSegment), ["classes", "events"]);
});

test("derives page static params without changing navigation inclusion rules", () => {
  assert.deepEqual(navigationPageParams(navigation, documentIdSegment), [
    { category: "classes", slug: "conversation-salon" },
    { category: "classes", slug: "nihongo-handbook" },
    { category: "events", slug: "international-fair" },
  ]);
});

test("derives grouped route data in navigation order", () => {
  assert.deepEqual(navigationRouteGroups(navigation, documentIdSegment), [
    { category: "classes", pageSlugs: ["conversation-salon", "nihongo-handbook"] },
    { category: "events", pageSlugs: ["international-fair"] },
  ]);
});
