// Keep the snapshot fields aligned with resolveSanityRevalidationPlan.
// Bodies are intentionally omitted: every published update expires its own
// document; only these fields can affect other cached documents or metadata.
const snapshot = `{
  _id, _type, slug, categoryRef, title, description, images,
  publishedAt, heroImage, category, hero{image}, org{name, abbreviation}
}`;
export const targetedWebhookProjection = `{
  "schemaVersion": 1,
  "before": before()${snapshot},
  "after": after()${snapshot}
}`;
export const legacyWebhookProjection = "{ _id, _type, slug, categoryRef }";

export async function configureRevalidationWebhook(
  client,
  { live = false, rollback = false } = {},
) {
  const hooks = await client.request({ uri: "/hooks", method: "GET" });
  const hook = hooks.find((item) => item.id === "sDXypB7MGF0f3GPc");
  if (
    !hook ||
    hook.dataset !== "production" ||
    hook.type !== "document" ||
    hook.url !== "https://yia-nextjs.vercel.app/api/revalidate" ||
    hook.isDisabled ||
    hook.includeDrafts ||
    hook.includeAllVersions ||
    !["create", "update", "delete"].every((event) => hook.rule?.on?.includes(event))
  ) {
    throw new Error(
      "The production webhook no longer matches the reviewed identity or event policy.",
    );
  }
  const projection = rollback ? legacyWebhookProjection : targetedWebhookProjection;
  const changed = hook.rule.projection !== projection;
  if (live && changed) {
    await client.request({
      uri: `/hooks/${hook.id}`,
      method: "PATCH",
      body: { rule: { ...hook.rule, projection } },
    });
    const updated = (await client.request({ uri: "/hooks", method: "GET" })).find(
      (item) => item.id === hook.id,
    );
    if (
      updated?.rule?.projection !== projection ||
      JSON.stringify(updated.headers) !== JSON.stringify(hook.headers) ||
      updated.url !== hook.url ||
      updated.dataset !== hook.dataset ||
      JSON.stringify(updated.rule.on) !== JSON.stringify(hook.rule.on) ||
      updated.rule.filter !== hook.rule.filter ||
      updated.includeDrafts !== hook.includeDrafts ||
      updated.includeAllVersions !== hook.includeAllVersions ||
      updated.isDisabled
    ) {
      throw new Error(
        "Webhook read-back did not match the requested projection and preserved settings.",
      );
    }
  }
  // Never include authentication headers, tokens, or complete API responses.
  return {
    id: hook.id,
    dataset: hook.dataset,
    live,
    changed,
    rollback,
    beforeProjection: hook.rule.projection,
    afterProjection: projection,
  };
}
