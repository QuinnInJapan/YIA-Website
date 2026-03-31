"use client";

import { useMemo, useState } from "react";
import { useClient } from "sanity";
import createImageUrlBuilder from "@sanity/image-url";
import { Button, Card, Stack, Flex, Text, Dialog, Box, Checkbox } from "@sanity/ui";
import { i18nGet } from "../shared/i18n";
import { SectionWrapper } from "./SectionWrapper";
import type {
  HomepageFeaturedData,
  HomepageFeaturedSlotData,
  CategoryData,
  NavCategoryData,
  PageData,
  UpdateFieldFn,
} from "./types";

const SLOT_KEYS = ["slot1", "slot2", "slot3", "slot4"] as const;
const SLOT_LABELS = ["スロット 1", "スロット 2", "スロット 3", "スロット 4"];

export function ProgramCardsSection({
  featured,
  categories,
  navCategories,
  allPages,
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

  // Filter out "about" category
  const availableCategories = useMemo(
    () => categories.filter((c) => c._id !== "category-about"),
    [categories],
  );

  return (
    <SectionWrapper id="section-programs" title="注目カテゴリー (Featured Categories)">
      <Stack space={4}>
        {SLOT_KEYS.map((slotKey, index) => {
          const slot = featured?.[slotKey] as HomepageFeaturedSlotData | undefined;
          return (
            <SlotCard
              key={slotKey}
              slotKey={slotKey}
              slotLabel={SLOT_LABELS[index]}
              slot={slot}
              categories={availableCategories}
              navCategories={navCategories}
              allPages={allPages}
              builder={builder}
              updateField={updateField}
            />
          );
        })}
      </Stack>
    </SectionWrapper>
  );
}

function SlotCard({
  slotKey,
  slotLabel,
  slot,
  categories,
  navCategories,
  allPages,
  builder,
  updateField,
}: {
  slotKey: string;
  slotLabel: string;
  slot: HomepageFeaturedSlotData | undefined;
  categories: CategoryData[];
  navCategories: NavCategoryData[];
  allPages: PageData[];
  builder: ReturnType<typeof createImageUrlBuilder>;
  updateField: UpdateFieldFn;
}) {
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showPagePicker, setShowPagePicker] = useState(false);

  const selectedCatId = slot?.categoryRef?._ref;
  const selectedCat = categories.find((c) => c._id === selectedCatId);
  const selectedPageRefs = slot?.pages ?? [];

  // Get hero image URL for the selected category
  const heroImgUrl = useMemo(() => {
    if (!selectedCat?.heroImage?.asset?._ref) return null;
    return builder
      .image(selectedCat.heroImage)
      .width(400)
      .height(225)
      .fit("crop")
      .auto("format")
      .url();
  }, [selectedCat, builder]);

  // Resolve page titles from allPages
  const resolvedPages = useMemo(() => {
    return selectedPageRefs.map((ref) => {
      const pageId = ref._ref;
      const page = allPages.find((p) => p._id === pageId);
      return {
        _ref: pageId,
        title: page ? `${i18nGet(page.title, "ja")}` : pageId,
        titleEn: page ? `${i18nGet(page.title, "en")}` : "",
      };
    });
  }, [selectedPageRefs, allPages]);

  // Get pages available for the selected category (from navCategories)
  const availablePages = useMemo(() => {
    if (!selectedCatId) return [];
    const navCat = navCategories.find((nc) => nc.categoryId === selectedCatId);
    if (!navCat) return [];
    // Match nav items to allPages by slug
    const result: PageData[] = [];
    for (const item of navCat.items) {
      const page = allPages.find((p) => p.slug === item.slug);
      if (page) result.push(page);
    }
    return result;
  }, [selectedCatId, navCategories, allPages]);

  function handleSelectCategory(catId: string) {
    updateField("homepageFeatured", "homepageFeatured", slotKey, {
      categoryRef: { _type: "reference", _ref: catId },
      pages: [],
    });
    setShowCategoryPicker(false);
  }

  function handleTogglePage(pageId: string) {
    const currentPages = selectedPageRefs.filter((r) => r._ref !== pageId);
    const isRemoving = currentPages.length < selectedPageRefs.length;

    let newPages;
    if (isRemoving) {
      newPages = currentPages;
    } else {
      if (selectedPageRefs.length >= 4) return; // Max 4
      newPages = [...selectedPageRefs, { _type: "reference" as const, _ref: pageId, _key: pageId }];
    }

    updateField("homepageFeatured", "homepageFeatured", slotKey, {
      categoryRef: slot?.categoryRef ?? undefined,
      pages: newPages,
    });
  }

  function handleClosePagePicker() {
    setShowPagePicker(false);
  }

  return (
    <Card border padding={3} radius={2}>
      <Stack space={3}>
        {/* Slot header */}
        <Flex align="center" justify="space-between">
          <Text size={1} weight="semibold">
            {slotLabel}
          </Text>
          <Button
            text="カテゴリーを選択"
            mode="ghost"
            fontSize={0}
            padding={2}
            onClick={() => setShowCategoryPicker(true)}
          />
        </Flex>

        {selectedCat ? (
          <>
            {/* Category info with hero image */}
            <Flex gap={3} align="flex-start">
              {heroImgUrl ? (
                <div
                  style={{
                    width: 120,
                    height: 68,
                    borderRadius: 4,
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={heroImgUrl}
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
                    width: 120,
                    height: 68,
                    borderRadius: 4,
                    background: "var(--card-muted-bg-color, #eee)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Text size={0} muted>
                    画像なし
                  </Text>
                </div>
              )}
              <Stack space={2} style={{ flex: 1 }}>
                <Text size={1} weight="medium">
                  {i18nGet(selectedCat.label, "ja")}
                </Text>
                <Text size={0} muted>
                  {i18nGet(selectedCat.label, "en")}
                </Text>
              </Stack>
            </Flex>

            {/* Featured pages */}
            <Stack space={2}>
              <Flex align="center" justify="space-between">
                <Text size={0} muted>
                  表示ページ ({resolvedPages.length}/4)
                </Text>
                <Button
                  text="ページ編集"
                  mode="ghost"
                  fontSize={0}
                  padding={2}
                  onClick={() => setShowPagePicker(true)}
                />
              </Flex>
              {resolvedPages.length > 0 ? (
                <Stack space={1}>
                  {resolvedPages.map((p, i) => (
                    <Card key={p._ref} padding={2} radius={1} tone="transparent">
                      <Text size={0}>
                        {i + 1}. {p.title}
                        {p.titleEn && (
                          <span style={{ color: "var(--card-muted-fg-color)", marginLeft: 6 }}>
                            {p.titleEn}
                          </span>
                        )}
                      </Text>
                    </Card>
                  ))}
                </Stack>
              ) : (
                <Text size={0} muted>
                  ページが選択されていません
                </Text>
              )}
            </Stack>
          </>
        ) : (
          <Card padding={4} radius={2} tone="transparent" style={{ textAlign: "center" }}>
            <Text size={1} muted>
              カテゴリーが選択されていません
            </Text>
          </Card>
        )}
      </Stack>

      {/* Category picker dialog */}
      {showCategoryPicker && (
        <Dialog
          id={`cat-picker-${slotKey}`}
          header="カテゴリーを選択"
          onClose={() => setShowCategoryPicker(false)}
          width={1}
        >
          <Box padding={3}>
            <Stack space={2}>
              {categories.map((cat) => (
                <Card
                  key={cat._id}
                  padding={3}
                  radius={2}
                  tone={cat._id === selectedCatId ? "primary" : "default"}
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSelectCategory(cat._id)}
                >
                  <Flex gap={3} align="center">
                    {cat.heroImage?.asset?._ref ? (
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
                          src={builder
                            .image(cat.heroImage)
                            .width(120)
                            .height(68)
                            .fit("crop")
                            .auto("format")
                            .url()}
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
                    <Stack space={1}>
                      <Text size={1}>{i18nGet(cat.label, "ja")}</Text>
                      <Text size={0} muted>
                        {i18nGet(cat.label, "en")}
                      </Text>
                    </Stack>
                  </Flex>
                </Card>
              ))}
            </Stack>
          </Box>
        </Dialog>
      )}

      {/* Page picker dialog */}
      {showPagePicker && (
        <Dialog
          id={`page-picker-${slotKey}`}
          header="表示するページを選択（最大4件）"
          onClose={handleClosePagePicker}
          width={1}
        >
          <Box padding={3}>
            <Stack space={2}>
              {availablePages.length > 0 ? (
                availablePages.map((page) => {
                  const isSelected = selectedPageRefs.some((r) => r._ref === page._id);
                  const isDisabled = !isSelected && selectedPageRefs.length >= 4;
                  return (
                    <Card key={page._id} padding={3} radius={2}>
                      <Flex
                        align="center"
                        gap={3}
                        style={{
                          cursor: isDisabled ? "not-allowed" : "pointer",
                          opacity: isDisabled ? 0.5 : 1,
                        }}
                        onClick={() => !isDisabled && handleTogglePage(page._id)}
                      >
                        <Checkbox checked={isSelected} readOnly />
                        <Stack space={1}>
                          <Text size={1}>{i18nGet(page.title, "ja")}</Text>
                          <Text size={0} muted>
                            {i18nGet(page.title, "en")}
                          </Text>
                        </Stack>
                      </Flex>
                    </Card>
                  );
                })
              ) : (
                <Text size={1} muted>
                  このカテゴリーにはページがありません
                </Text>
              )}
            </Stack>
          </Box>
        </Dialog>
      )}
    </Card>
  );
}
