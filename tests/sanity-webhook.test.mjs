import assert from "node:assert/strict";
import { test } from "node:test";
import { parse, evaluate } from "groq-js";
import {
  targetedWebhookProjection,
  configureRevalidationWebhook,
} from "../scripts/lib/sanity-webhook.mjs";
import { resolveSanityRevalidationPlan, sanityTags } from "../lib/sanity/revalidation.ts";

const project = async (before, after) =>
  (await evaluate(parse(targetedWebhookProjection, { mode: "delta" }), { before, after })).get();

test("the actual GROQ webhook projection preserves create/delete and old/new slug snapshots", async () => {
  const before = {
    _type: "page",
    _id: "page-test",
    slug: "old",
    title: [],
    sections: ["large body"],
  };
  const after = { ...before, slug: "new" };
  const rename = await project(before, after);
  assert.equal(rename.schemaVersion, 1);
  assert.equal(rename.before.slug, "old");
  assert.equal(rename.after.slug, "new");
  assert.ok(!Object.hasOwn(rename.before, "sections"));
  assert.equal((await project(null, after)).before, null);
  assert.equal((await project(before, null)).after, null);
  assert.ok(resolveSanityRevalidationPlan(rename).tags.includes(sanityTags.navigationRoutes));
});

test("projected body edits do not expire navigation or social-image dependencies", async () => {
  const before = { _type: "page", _id: "page-test", slug: "test", title: [], sections: ["old"] };
  const plan = resolveSanityRevalidationPlan(
    await project(before, { ...before, sections: ["new"] }),
  );
  assert.ok(!plan.tags.includes(sanityTags.navigation));
  assert.ok(!plan.tags.includes(sanityTags.social));
  assert.ok(plan.tags.includes("sanity:page:test"));
});

test("webhook configuration dry run never writes; live updates only the projection and reads back", async () => {
  let hook = {
    id: "sDXypB7MGF0f3GPc",
    type: "document",
    dataset: "production",
    url: "https://yia-nextjs.vercel.app/api/revalidate",
    includeDrafts: false,
    includeAllVersions: false,
    isDisabled: false,
    headers: { Authorization: "test-only" },
    rule: { on: ["create", "update", "delete"], filter: "original", projection: "old" },
  };
  const calls = [];
  const client = {
    async request(request) {
      calls.push(request);
      if (request.method === "GET") return [structuredClone(hook)];
      assert.deepEqual(Object.keys(request.body), ["rule"]);
      assert.deepEqual(Object.keys(request.body.rule).sort(), ["filter", "on", "projection"]);
      hook = { ...hook, ...request.body };
      return hook;
    },
  };
  await configureRevalidationWebhook(client);
  assert.equal(calls.length, 1);
  const result = await configureRevalidationWebhook(client, { live: true });
  assert.equal(hook.rule.projection, targetedWebhookProjection);
  assert.ok(!JSON.stringify(result).includes("test-only"));
  assert.deepEqual(
    calls.map((call) => call.method),
    ["GET", "GET", "PATCH", "GET"],
  );
});
