"use client";

import { useMemo } from "react";
import { useClient } from "sanity";
import createImageUrlBuilder from "@sanity/image-url";
import { Card, Stack, Flex, Text, Checkbox } from "@sanity/ui";
import { i18nGet } from "../shared/i18n";
import { SectionWrapper } from "./SectionWrapper";
import type {
  HomepageFeaturedData,
  CategoryData,
  NavCategoryData,
  PageData,
  UpdateFieldFn,
} from "./types";

const MAX_FEATURED = 4;

export function ProgramCardsSection({
  featured,
  categories,
  navCategories,
  updateField,
}: {
  featured: HomepageFeaturedData | null;
  categories: CategoryData[];
  navCategories: NavCategoryData[];
  allPages: PageData[];
  updateField: UpdateFieldFn;
}) {
  const client = useClient({ apiVersion: "2024-01-01" });
  const builder = useMemo(() => createImageUrlBuilder(client), [client]);

  // Nav-ordered list of available categories (excluding "about")
  const orderedCategories = useMemo(() => {
    return navCategories
      .map((nc) =>
        categories.find((c) => c._id === nc.categoryId || c._id === `drafts.${nc.categoryId}`),
      )
      .filter((c): c is CategoryData => !!c && !c._id.includes("about"));
  }, [navCategories, categories]);

  const selectedRefs = useMemo(
    () => new Set((featured?.categories ?? []).map((r) => r._ref)),
    [featured],
  );

  function handleToggle(catId: string) {
    const isSelected = selectedRefs.has(catId);

    let newRefs: string[];
    if (isSelected) {
      newRefs = [...selectedRefs].filter((r) => r !== catId);
    } else {
      if (selectedRefs.size >= MAX_FEATURED) return;
      newRefs = [...selectedRefs, catId];
    }

    // Maintain nav order
    const navOrder = orderedCategories.map((c) => c._id);
    newRefs.sort((a, b) => navOrder.indexOf(a) - navOrder.indexOf(b));

    const newCategories = newRefs.map((ref) => ({
      _type: "reference" as const,
      _ref: ref,
      _key: ref,
    }));

    updateField("homepageFeatured", "homepageFeatured", "categories", newCategories);
  }

  return (
    <SectionWrapper id="section-programs" title="注目カテゴリー (Featured Categories)">
      <Stack space={2}>
        <Text size={0} muted>
          表示するカテゴリーを選択（最大{MAX_FEATURED}件）。順序はナビゲーションに従います。
        </Text>
        <Card border radius={2} padding={1}>
          <Stack space={0}>
            {orderedCategories.map((cat, i) => {
              const catId = cat._id.replace(/^drafts\./, "");
              const isSelected = selectedRefs.has(catId) || selectedRefs.has(cat._id);
              const isDisabled = !isSelected && selectedRefs.size >= MAX_FEATURED;
              const imgUrl = cat.heroImage?.asset?._ref
                ? builder.image(cat.heroImage).width(80).height(45).fit("crop").auto("format").url()
                : null;

              return (
                <Card
                  key={cat._id}
                  padding={2}
                  radius={1}
                  tone={isSelected ? "primary" : "default"}
                  style={{
                    cursor: isDisabled ? "not-allowed" : "pointer",
                    opacity: isDisabled ? 0.45 : 1,
                    borderTop: i > 0 ? "1px solid var(--card-border-color)" : undefined,
                  }}
                  onClick={() => !isDisabled && handleToggle(catId)}
                >
                  <Flex align="center" gap={3}>
                    <Checkbox
                      checked={isSelected}
                      readOnly
                      style={{ pointerEvents: "none", flexShrink: 0 }}
                    />
                    {imgUrl ? (
                      <div
                        style={{
                          width: 60,
                          height: 34,
                          borderRadius: 3,
                          overflow: "hidden",
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={imgUrl}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          width: 60,
                          height: 34,
                          borderRadius: 3,
                          background: "var(--card-muted-bg-color, #eee)",
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <Stack space={1} style={{ flex: 1 }}>
                      <Text size={1} weight={isSelected ? "semibold" : "regular"}>
                        {i18nGet(cat.label, "ja")}
                      </Text>
                      <Text size={0} muted>
                        {i18nGet(cat.label, "en")}
                      </Text>
                    </Stack>
                    {isSelected && (
                      <Text size={0} muted>
                        #{Array.from(selectedRefs).indexOf(catId) + 1}
                      </Text>
                    )}
                  </Flex>
                </Card>
              );
            })}
          </Stack>
        </Card>
        <Text size={0} muted>
          {selectedRefs.size}/{MAX_FEATURED} 選択中
        </Text>
      </Stack>
    </SectionWrapper>
  );
}
