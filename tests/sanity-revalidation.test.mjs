import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  resolveSanityRevalidationTargets,
  SANITY_SITE_DATA_TAG,
} from "../lib/sanity/revalidation.ts";

describe("resolveSanityRevalidationTargets", () => {
  it("revalidates the exact public page, category page, and homepage for page documents", () => {
    assert.deepEqual(
      resolveSanityRevalidationTargets({
        _type: "page",
        slug: "youth-forum",
        categoryRef: { _ref: "category-events" },
      }),
      [
        { path: "/", type: "page" },
        { path: "/events", type: "page" },
        { path: "/events/youth-forum", type: "page" },
      ],
    );
  });

  it("honors explicit webhook paths while keeping them safe", () => {
    assert.deepEqual(
      resolveSanityRevalidationTargets({
        paths: ["/", "/events/youth-forum", "https://example.com/nope", "../bad", ""],
      }),
      [
        { path: "/", type: "page" },
        { path: "/events/youth-forum", type: "page" },
      ],
    );
  });

  it("revalidates the whole site layout for global navigation changes", () => {
    assert.deepEqual(resolveSanityRevalidationTargets({ _type: "navigation" }), [
      { path: "/", type: "layout" },
    ]);
  });

  it("exports the Sanity data tag used by fetch and the webhook route", () => {
    assert.equal(SANITY_SITE_DATA_TAG, "sanity:site-data");
  });
});
