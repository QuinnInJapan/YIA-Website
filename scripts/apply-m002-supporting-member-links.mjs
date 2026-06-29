#!/usr/bin/env node

import crypto from "node:crypto";
import { fail, logSummary, patchWithRevision, runSanityScript } from "./lib/sanity-tools.mjs";

const PAGE_ID = "page-sanjyokaiin";
const SAFE_HREF = /^(https?:\/\/|mailto:|tel:)/i;

function i18nValue(field, lang) {
  return field?.find((entry) => entry._key === lang)?.value ?? "";
}

function setI18nValue(field, lang, value) {
  const next = Array.isArray(field) ? [...field] : [];
  const index = next.findIndex((entry) => entry._key === lang);
  if (index === -1) return [...next, { _key: lang, value }];
  next[index] = { ...next[index], value };
  return next;
}

function safeHref(value) {
  const href = typeof value === "string" ? value.trim() : "";
  return SAFE_HREF.test(href) ? href : "";
}

function stableKey(rowKey, colKey) {
  return crypto.createHash("sha1").update(`m002:${rowKey}:${colKey}`).digest("hex").slice(0, 12);
}

function isOrgColumn(col) {
  return i18nValue(col.label, "ja") === "団体名" || i18nValue(col.label, "en") === "Organization";
}

function isPhoneColumn(col) {
  return i18nValue(col.label, "ja") === "電話" || i18nValue(col.label, "en") === "Tel";
}

await runSanityScript({
  name: "M-002 supporting member links",
  description:
    "Moves supporting-member homepage URLs into table hyperlink cells and clears URL text from the visible organization-name cell.",
  async handler({ client, dryRun }) {
    const page = await client.fetch(`*[_type == "page" && _id == $pageId][0]{_id,_rev,sections}`, {
      pageId: PAGE_ID,
    });
    if (!page) {
      throw fail("Supporting members page was not found.", {
        fix: "Check the page id before rerunning the script.",
        context: { pageId: PAGE_ID },
      });
    }

    const sections = structuredClone(page.sections ?? []);
    const section = sections.find((item) => item._type === "table");
    if (!section) {
      throw fail("Supporting members table section was not found.", {
        fix: "Check the current Sanity page sections before rerunning the script.",
        context: { pageId: PAGE_ID },
      });
    }

    const orgColIndex = (section.columns ?? []).findIndex(isOrgColumn);
    if (orgColIndex === -1) {
      throw fail("Organization column was not found.", {
        fix: "Check the supporting members table column labels.",
        context: { pageId: PAGE_ID, sectionKey: section._key },
      });
    }

    const orgCol = section.columns[orgColIndex];
    const phoneCol = (section.columns ?? []).find(isPhoneColumn);
    let changed = false;
    let existingLinkedRows = 0;
    let migratedRows = 0;
    let clearedVisibleUrls = 0;

    if (orgCol.type !== "hyperlink") {
      orgCol.type = "hyperlink";
      changed = true;
    }

    if (phoneCol && phoneCol.type !== "text") {
      phoneCol.type = "text";
      changed = true;
    }

    for (const row of section.rows ?? []) {
      if (row.groupLabel) continue;

      const orgCell = row.cells?.[orgColIndex];
      const existing = row.hyperlinkCells ?? [];
      if (existing.some((cell) => cell.colKey === orgCol._key && safeHref(cell.href))) {
        existingLinkedRows += 1;
      }

      const href = safeHref(i18nValue(orgCell, "en"));
      if (!href) continue;

      const current = existing.find((cell) => cell.colKey === orgCol._key);
      if (current?.href !== href) {
        row.hyperlinkCells = [
          ...existing.filter((cell) => cell.colKey !== orgCol._key),
          {
            _key: current?._key ?? stableKey(row._key, orgCol._key),
            colKey: orgCol._key,
            href,
          },
        ];
        changed = true;
      }
      migratedRows += 1;

      row.cells[orgColIndex] = setI18nValue(orgCell, "en", "");
      clearedVisibleUrls += 1;
      changed = true;
    }

    if (changed) {
      await patchWithRevision(client, page, { sections }, { dryRun });
    } else {
      console.log("No M-002 Sanity changes needed.");
    }

    logSummary({
      pageId: PAGE_ID,
      sectionKey: section._key,
      organizationColumnType: orgCol.type,
      phoneColumnType: phoneCol?.type ?? null,
      existingLinkedRows,
      migratedRows,
      clearedVisibleUrls,
      changed,
      dryRun,
    });
  },
});
