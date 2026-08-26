interface SearchI18nValue {
  _key: string;
  value: string;
}

export interface SearchableInternalPage {
  title?: SearchI18nValue[] | null;
  slug?: string | null;
  categoryId?: string | null;
  categoryTitle?: SearchI18nValue[] | null;
  sections?: Array<{ title?: SearchI18nValue[] | null }> | null;
}

function valueFor(field: SearchI18nValue[] | null | undefined, language: string): string {
  return field?.find((entry) => entry._key === language)?.value ?? "";
}

function normalizeSearch(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("ja").replace(/\s+/g, " ").trim();
}

function searchTerms(query: string): string[] {
  return normalizeSearch(query).split(" ").filter(Boolean);
}

export function searchableInternalPagePath(page: SearchableInternalPage): string {
  if (!page.categoryId || !page.slug) return "";
  return `/${page.categoryId.replace(/^category-/, "")}/${page.slug}`;
}

export function internalPageSearchText(page: SearchableInternalPage): string {
  return normalizeSearch(
    [
      valueFor(page.title, "ja"),
      valueFor(page.title, "en"),
      valueFor(page.categoryTitle, "ja"),
      valueFor(page.categoryTitle, "en"),
      page.slug ?? "",
      searchableInternalPagePath(page),
      ...(page.sections ?? []).flatMap((section) => [
        valueFor(section.title, "ja"),
        valueFor(section.title, "en"),
      ]),
    ].join(" "),
  );
}

export function matchingInternalPageHeading(
  page: SearchableInternalPage,
  query: string,
): string {
  const terms = searchTerms(query);
  if (terms.length === 0) return "";

  const headings = (page.sections ?? []).flatMap((section) => [
    valueFor(section.title, "ja"),
    valueFor(section.title, "en"),
  ]);
  let bestHeading = "";
  let bestScore = 0;

  for (const heading of headings) {
    const normalizedHeading = normalizeSearch(heading);
    const score = terms.filter((term) => normalizedHeading.includes(term)).length;
    if (score > bestScore) {
      bestHeading = heading;
      bestScore = score;
    }
  }

  return bestHeading;
}

function resultScore(page: SearchableInternalPage, terms: string[]): number {
  const titles = normalizeSearch(
    [valueFor(page.title, "ja"), valueFor(page.title, "en")].join(" "),
  );
  const categories = normalizeSearch(
    [valueFor(page.categoryTitle, "ja"), valueFor(page.categoryTitle, "en")].join(" "),
  );
  const path = normalizeSearch(`${page.slug ?? ""} ${searchableInternalPagePath(page)}`);
  const headings = normalizeSearch(
    (page.sections ?? [])
      .flatMap((section) => [valueFor(section.title, "ja"), valueFor(section.title, "en")])
      .join(" "),
  );

  return terms.reduce((score, term) => {
    if (titles.startsWith(term)) return score + 50;
    if (titles.includes(term)) return score + 40;
    if (categories.includes(term)) return score + 30;
    if (path.includes(term)) return score + 20;
    if (headings.includes(term)) return score + 10;
    return score;
  }, 0);
}

export function filterInternalPages<T extends SearchableInternalPage>(
  pages: T[],
  query: string,
): T[] {
  const terms = searchTerms(query);
  if (terms.length === 0) return pages;
  return pages
    .map((page, index) => ({ page, index }))
    .filter(({ page }) => {
      const searchable = internalPageSearchText(page);
      return terms.every((term) => searchable.includes(term));
    })
    .sort(
      (left, right) =>
        resultScore(right.page, terms) - resultScore(left.page, terms) || left.index - right.index,
    )
    .map(({ page }) => page);
}
