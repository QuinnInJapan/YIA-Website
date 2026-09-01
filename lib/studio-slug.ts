export const STUDIO_SLUG_MAX_LENGTH = 96;

export function studioSlugValue(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object" && "current" in value) {
    const current = (value as { current?: unknown }).current;
    return typeof current === "string" ? current.trim() : "";
  }
  return "";
}

export function recommendedSlugFromEnglishTitle(
  title: string,
  maxLength = STUDIO_SLUG_MAX_LENGTH,
): string {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
}

export function recommendedSlugDefault(value: unknown, englishTitle: string): string | null {
  if (studioSlugValue(value)) return null;
  return recommendedSlugFromEnglishTitle(englishTitle) || null;
}

export function studioSlugError(value: unknown): string | null {
  const slug = studioSlugValue(value);

  if (!slug) return "公開URLを入力してください。";

  if (/^https?:\/\//i.test(slug) || slug.includes("/")) {
    return "URL全体ではなく、URLの末尾に入る文字だけを入力してください。";
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return "半角小文字の英数字とハイフンだけを使用してください。例：summer-event";
  }

  if (slug.length > STUDIO_SLUG_MAX_LENGTH) {
    return `公開URLは${STUDIO_SLUG_MAX_LENGTH}文字以内にしてください。`;
  }

  return null;
}
