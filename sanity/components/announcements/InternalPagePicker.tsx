"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button, TextInput } from "@sanity/ui";
import { SearchIcon } from "@sanity/icons";
import { i18nGet } from "../shared/i18n";
import { tocId } from "@/lib/toc-id";
import { fs } from "@/sanity/lib/studioTokens";
import type { ImageItem } from "../pages/types";
import {
  filterInternalPages,
  matchingInternalPageHeading,
  searchableInternalPagePath,
} from "@/lib/announcement-page-search";

export interface InternalPageSection {
  _key: string;
  _type: string;
  title?: { _key: string; value: string }[] | null;
  tocLevel?: "section" | "subsection" | "hidden" | null;
}

export interface InternalPageOption {
  _id: string;
  title: { _key: string; value: string }[] | null;
  description?: { _key: string; value: string }[] | null;
  slug: string | null;
  categoryId: string | null;
  categoryTitle?: { _key: string; value: string }[] | null;
  images?: ImageItem[] | null;
  sections: InternalPageSection[] | null;
}

export interface InternalPageTocOption {
  id: string;
  title: string;
  level: "section" | "subsection";
}

const TOC_SECTION_TYPES = new Set([
  "content",
  "links",
  "table",
  "labelTable",
  "infoCards",
  "imageCards",
]);

export function pageTocOptions(
  page: InternalPageOption | null | undefined,
): InternalPageTocOption[] {
  const options: InternalPageTocOption[] = [];
  const occurrences = new Map<string, number>();

  for (const section of page?.sections ?? []) {
    if (!TOC_SECTION_TYPES.has(section._type)) continue;
    const title = i18nGet(section.title, "ja").trim();
    if (!title) continue;

    const baseId = tocId(title);
    const occurrence = occurrences.get(baseId) ?? 0;
    occurrences.set(baseId, occurrence + 1);
    const id = tocId(title, occurrence);

    if (section.tocLevel !== "hidden") {
      options.push({
        id,
        title,
        level: section.tocLevel === "subsection" ? "subsection" : "section",
      });
    }
  }

  return options;
}

export function internalPagePath(page: InternalPageOption | null | undefined): string {
  return page ? searchableInternalPagePath(page) : "";
}

export function InternalPagePicker({
  pages,
  selectedPage,
  loading,
  error,
  onSelect,
}: {
  pages: InternalPageOption[];
  selectedPage?: InternalPageOption | null;
  loading: boolean;
  error: boolean;
  onSelect: (pageId: string) => void;
}) {
  const [editing, setEditing] = useState(!selectedPage);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => filterInternalPages(pages, query), [pages, query]);
  const visibleResults = results.slice(0, 12);
  const listboxId = "announcement-internal-page-results";

  useEffect(() => {
    if (!selectedPage) setEditing(true);
  }, [selectedPage]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node) && selectedPage) setEditing(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [selectedPage]);

  function beginSearch() {
    setQuery("");
    setActiveIndex(0);
    setEditing(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function choose(page: InternalPageOption) {
    onSelect(page._id);
    setQuery("");
    setActiveIndex(0);
    setEditing(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, visibleResults.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && visibleResults[activeIndex]) {
      event.preventDefault();
      choose(visibleResults[activeIndex]);
    } else if (event.key === "Escape" && selectedPage) {
      event.preventDefault();
      setEditing(false);
    }
  }

  return (
    <div ref={wrapperRef}>
      <div style={{ marginBottom: 7, fontSize: fs.label, fontWeight: 600 }}>
        1. リンク先ページを選ぶ
      </div>

      {selectedPage && !editing ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 12px",
            border: "1px solid var(--card-focus-ring-color, #4a90d9)",
            borderRadius: 6,
            background: "rgba(74, 144, 217, 0.06)",
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontSize: fs.body,
                fontWeight: 600,
              }}
            >
              {i18nGet(selectedPage.title, "ja") || "（タイトルなし）"}
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "2px 8px",
                marginTop: 3,
                color: "var(--card-muted-fg-color)",
                fontSize: fs.meta,
              }}
            >
              {i18nGet(selectedPage.categoryTitle, "ja") ? (
                <span>{i18nGet(selectedPage.categoryTitle, "ja")}</span>
              ) : null}
              <code style={{ fontFamily: "ui-monospace, monospace" }}>
                {internalPagePath(selectedPage)}
              </code>
            </div>
          </div>
          <Button text="変更" mode="ghost" fontSize={0} padding={2} onClick={beginSearch} />
        </div>
      ) : (
        <div>
          <TextInput
            ref={inputRef}
            icon={SearchIcon}
            value={query}
            placeholder="ページ名・カテゴリ・URL・見出しで検索"
            onChange={(event) => {
              setQuery(event.currentTarget.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            role="combobox"
            aria-label="リンク先ページを検索"
            aria-expanded="true"
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={
              visibleResults[activeIndex]
                ? `announcement-page-option-${visibleResults[activeIndex]._id}`
                : undefined
            }
            disabled={loading}
          />

          <div
            id={listboxId}
            role="listbox"
            aria-label="リンク先ページの候補"
            style={{
              maxHeight: 272,
              marginTop: 6,
              overflowY: "auto",
              border: "1px solid var(--card-border-color)",
              borderRadius: 6,
              background: "var(--card-bg-color)",
            }}
          >
            {loading ? (
              <div style={{ padding: 12, color: "var(--card-muted-fg-color)", fontSize: fs.body }}>
                ページを読み込み中…
              </div>
            ) : error ? (
              <div role="alert" style={{ padding: 12, color: "#b42318", fontSize: fs.body }}>
                ページ一覧を読み込めませんでした。画面を再読み込みしてください。
              </div>
            ) : visibleResults.length === 0 ? (
              <div style={{ padding: 12, color: "var(--card-muted-fg-color)", fontSize: fs.body }}>
                「{query}」に一致するページがありません
              </div>
            ) : (
              visibleResults.map((page, index) => {
                const selected = index === activeIndex;
                const matchingHeading = matchingInternalPageHeading(page, query);
                return (
                  <button
                    id={`announcement-page-option-${page._id}`}
                    key={page._id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => choose(page)}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "9px 11px",
                      border: 0,
                      borderBottom:
                        index < visibleResults.length - 1
                          ? "1px solid var(--card-border-color)"
                          : 0,
                      background: selected ? "rgba(74, 144, 217, 0.1)" : "transparent",
                      color: "var(--card-fg-color)",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span style={{ display: "block", fontSize: fs.body, fontWeight: 600 }}>
                      {i18nGet(page.title, "ja") || "（タイトルなし）"}
                    </span>
                    <span
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "2px 8px",
                        marginTop: 2,
                        color: "var(--card-muted-fg-color)",
                        fontSize: fs.meta,
                      }}
                    >
                      {i18nGet(page.categoryTitle, "ja") ? (
                        <span>{i18nGet(page.categoryTitle, "ja")}</span>
                      ) : null}
                      <code style={{ fontFamily: "ui-monospace, monospace" }}>
                        {internalPagePath(page)}
                      </code>
                    </span>
                    {matchingHeading ? (
                      <span
                        style={{
                          display: "block",
                          marginTop: 3,
                          color: "var(--card-muted-fg-color)",
                          fontSize: fs.meta,
                        }}
                      >
                        見出し：{matchingHeading}
                      </span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>

          {!loading && !error && results.length > 12 ? (
            <div
              style={{
                marginTop: 5,
                color: "var(--card-muted-fg-color)",
                fontSize: fs.meta,
              }}
            >
              {results.length}件中12件を表示。文字を追加すると候補を絞れます。
            </div>
          ) : null}

          {selectedPage ? (
            <div style={{ marginTop: 7 }}>
              <Button
                text="変更をやめる"
                mode="bleed"
                fontSize={0}
                padding={1}
                onClick={() => setEditing(false)}
              />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
