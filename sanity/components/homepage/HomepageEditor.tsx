"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useClient } from "sanity";
import { Box, Button, Flex, Text } from "@sanity/ui";
import { PublishIcon } from "@sanity/icons";
import { LoadingDots } from "../shared/ui";
import { RawJsonButton } from "../shared/RawJsonViewer";
import { HeroSection } from "./HeroSection";
import { ProgramCardsSection } from "./ProgramCardsSection";
import { AboutSection } from "./AboutSection";
import { ActivityGridSection } from "./ActivityGridSection";
import { SettingsSection } from "./SettingsSection";
import type {
  HomepageData,
  HomepageAboutData,
  HomepageFeaturedData,
  SiteSettingsData,
  SidebarData,
  CategoryData,
  NavCategoryData,
  AnnouncementPreviewData,
  PageData,
  DocType,
  OpenPickerFn,
  ShowHotspotCropFn,
} from "./types";
import type { HomepageMergedState } from "./HomepagePreview";

// ── Section nav items ───────────────────────────────

const SECTIONS = [
  { id: "section-hero", label: "ヒーロー" },
  { id: "section-programs", label: "プログラム" },
  { id: "section-about", label: "YIA" },
  { id: "section-activity", label: "活動" },
  { id: "section-settings", label: "設定" },
] as const;

// ── Document state tracker ──────────────────────────

interface DocState<T> {
  published: T | null;
  draft: T | null;
  edits: Record<string, unknown>;
}

// ── HomepageEditor ──────────────────────────────────

export function HomepageEditor({
  onOpenImagePicker,
  onOpenFilePicker,
  onShowHotspotCrop,
  onOpenDocumentDetail,
  onMergedChange,
}: {
  onOpenImagePicker: OpenPickerFn;
  onOpenFilePicker: (onSelect: (assetId: string, filename: string, ext: string) => void) => void;
  onShowHotspotCrop: ShowHotspotCropFn;
  onOpenDocumentDetail?: (
    doc: import("../shared/DocumentDetailPanel").DocumentLinkItem,
    onUpdate: (doc: import("../shared/DocumentDetailPanel").DocumentLinkItem) => void,
    onRemove: () => void,
  ) => void;
  onMergedChange?: (state: HomepageMergedState | null) => void;
}) {
  const client = useClient({ apiVersion: "2024-01-01" });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "dirty" | "saving" | "error">("saved");
  const [activeSection, setActiveSection] = useState("section-hero");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Document states
  const [homepageState, setHomepageState] = useState<DocState<HomepageData>>({
    published: null,
    draft: null,
    edits: {},
  });
  const [aboutState, setAboutState] = useState<DocState<HomepageAboutData>>({
    published: null,
    draft: null,
    edits: {},
  });
  const [settingsState, setSettingsState] = useState<DocState<SiteSettingsData>>({
    published: null,
    draft: null,
    edits: {},
  });
  const [sidebarState, setSidebarState] = useState<DocState<SidebarData>>({
    published: null,
    draft: null,
    edits: {},
  });
  const [categoriesState, setCategoriesState] = useState<Map<string, DocState<CategoryData>>>(
    new Map(),
  );
  const [featuredState, setFeaturedState] = useState<DocState<HomepageFeaturedData>>({
    published: null,
    draft: null,
    edits: {},
  });
  const [allPages, setAllPages] = useState<PageData[]>([]);
  const [navCategories, setNavCategories] = useState<NavCategoryData[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementPreviewData[]>([]);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track pending saves per document
  const pendingEditsRef = useRef<Map<string, Record<string, unknown>>>(new Map());

  // ── Merged document views ────────────────────────

  const homepage = useMemo<HomepageData | null>(() => {
    const base = homepageState.draft ?? homepageState.published;
    if (!base) return null;
    return { ...base, ...homepageState.edits } as HomepageData;
  }, [homepageState]);

  const about = useMemo<HomepageAboutData | null>(() => {
    const base = aboutState.draft ?? aboutState.published;
    if (!base) return null;
    return { ...base, ...aboutState.edits } as HomepageAboutData;
  }, [aboutState]);

  const siteSettings = useMemo<SiteSettingsData | null>(() => {
    const base = settingsState.draft ?? settingsState.published;
    if (!base) return null;
    return { ...base, ...settingsState.edits } as SiteSettingsData;
  }, [settingsState]);

  const sidebar = useMemo<SidebarData | null>(() => {
    const base = sidebarState.draft ?? sidebarState.published;
    if (!base) return null;
    return { ...base, ...sidebarState.edits } as SidebarData;
  }, [sidebarState]);

  const categories = useMemo<CategoryData[]>(() => {
    const result: CategoryData[] = [];
    for (const [, state] of categoriesState) {
      const base = state.draft ?? state.published;
      if (base) result.push({ ...base, ...state.edits } as CategoryData);
    }
    return result;
  }, [categoriesState]);

  const featured = useMemo<HomepageFeaturedData | null>(() => {
    const base = featuredState.draft ?? featuredState.published;
    if (!base) return null;
    return { ...base, ...featuredState.edits } as HomepageFeaturedData;
  }, [featuredState]);

  const aboutId = useMemo(() => {
    return (aboutState.draft ?? aboutState.published)?._id?.replace(/^drafts\./, "") ?? "";
  }, [aboutState]);

  // Notify parent of merged state changes for preview
  useEffect(() => {
    if (homepage && siteSettings) {
      onMergedChange?.({
        homepage,
        about,
        siteSettings,
        sidebar,
        categories,
        navCategories,
        announcements,
        featured,
      });
    } else {
      onMergedChange?.(null);
    }
  }, [
    homepage,
    about,
    siteSettings,
    sidebar,
    categories,
    navCategories,
    announcements,
    featured,
    onMergedChange,
  ]);

  // ── Load all documents ───────────────────────────

  useEffect(() => {
    setLoading(true);
    Promise.all([
      client.fetch<HomepageData | null>(`*[_id == "homepage"][0]`),
      client.fetch<HomepageData | null>(`*[_id == "drafts.homepage"][0]`),
      client.fetch<HomepageAboutData | null>(
        `*[_type == "homepageAbout" && !(_id in path("drafts.**"))][0]`,
      ),
      client.fetch<SiteSettingsData | null>(`*[_id == "siteSettings"][0]`),
      client.fetch<SiteSettingsData | null>(`*[_id == "drafts.siteSettings"][0]`),
      client.fetch<SidebarData | null>(`*[_id == "sidebar"][0]`),
      client.fetch<SidebarData | null>(`*[_id == "drafts.sidebar"][0]`),
      client.fetch<CategoryData[]>(
        `*[_type == "category" && !(_id in path("drafts.**"))] | order(_createdAt asc)`,
      ),
      client.fetch<NavCategoryData[]>(
        `*[_type == "navigation"][0].categories[]{
          "categoryId": categoryRef->_id,
          "items": items[]{ "title": pageRef->title, "slug": pageRef->slug }
        }`,
      ),
      client.fetch<AnnouncementPreviewData[]>(
        `*[_type == "announcement" && !(_id in path("drafts.**"))] | order(pinned desc, date desc) [0...5] {
          _id, title, date, pinned, "slug": slug.current
        }`,
      ),
      client.fetch<HomepageFeaturedData | null>(`*[_id == "homepageFeatured"][0]`),
      client.fetch<HomepageFeaturedData | null>(`*[_id == "drafts.homepageFeatured"][0]`),
      client.fetch<PageData[]>(
        `*[_type == "page" && !(_id in path("drafts.**"))]{ _id, title, slug } | order(title asc)`,
      ),
    ])
      .then(
        async ([
          hpPub,
          hpDraft,
          aboutPub,
          settingsPub,
          settingsDraft,
          sidebarPub,
          sidebarDraft,
          cats,
          navCats,
          annList,
          featuredPub,
          featuredDraft,
          pages,
        ]) => {
          setHomepageState({ published: hpPub, draft: hpDraft, edits: {} });

          // For homepageAbout, also fetch its draft
          let aboutDraft: HomepageAboutData | null = null;
          if (aboutPub) {
            aboutDraft = await client.fetch<HomepageAboutData | null>(`*[_id == $id][0]`, {
              id: `drafts.${aboutPub._id}`,
            });
          }
          setAboutState({ published: aboutPub, draft: aboutDraft, edits: {} });

          setSettingsState({ published: settingsPub, draft: settingsDraft, edits: {} });
          setSidebarState({ published: sidebarPub, draft: sidebarDraft, edits: {} });

          // Categories: fetch drafts for each
          const catMap = new Map<string, DocState<CategoryData>>();
          const draftFetches = cats.map((cat) =>
            client.fetch<CategoryData | null>(`*[_id == $id][0]`, {
              id: `drafts.${cat._id}`,
            }),
          );
          const catDrafts = await Promise.all(draftFetches);
          cats.forEach((cat, i) => {
            catMap.set(cat._id, {
              published: cat,
              draft: catDrafts[i],
              edits: {},
            });
          });
          setCategoriesState(catMap);
          setFeaturedState({ published: featuredPub, draft: featuredDraft, edits: {} });
          setAllPages(pages ?? []);
          setNavCategories(navCats ?? []);
          setAnnouncements(annList ?? []);
        },
      )
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [client]);

  // ── Scroll spy for active section ────────────────

  const clickedSectionRef = useRef<string | null>(null);
  const lastScrollTopRef = useRef<number>(0);
  const scrollSettledRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    function handleScroll() {
      // While a click-initiated scroll is in progress, wait for it to settle
      if (clickedSectionRef.current) {
        if (scrollSettledRef.current) clearTimeout(scrollSettledRef.current);
        scrollSettledRef.current = setTimeout(() => {
          // Scroll stopped — lock the clicked section until user scrolls manually
          lastScrollTopRef.current = scrollEl!.scrollTop;
          scrollSettledRef.current = null;
        }, 100);
        return;
      }

      const scrollTop = scrollEl!.scrollTop + 80;
      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        const sectionEl = scrollEl!.querySelector(`#${SECTIONS[i].id}`) as HTMLElement | null;
        if (sectionEl && sectionEl.offsetTop <= scrollTop) {
          setActiveSection(SECTIONS[i].id);
          break;
        }
      }
    }

    // Detect user-initiated scroll via wheel/touch to clear the override
    function handleUserScroll() {
      if (clickedSectionRef.current) {
        clickedSectionRef.current = null;
      }
    }

    scrollEl.addEventListener("scroll", handleScroll, { passive: true });
    scrollEl.addEventListener("wheel", handleUserScroll, { passive: true });
    scrollEl.addEventListener("touchmove", handleUserScroll, { passive: true });
    return () => {
      scrollEl.removeEventListener("scroll", handleScroll);
      scrollEl.removeEventListener("wheel", handleUserScroll);
      scrollEl.removeEventListener("touchmove", handleUserScroll);
    };
  }, [loading]);

  // ── Auto-save logic ──────────────────────────────

  const saveToSanity = useCallback(async () => {
    const pending = new Map(pendingEditsRef.current);
    if (pending.size === 0) return;
    pendingEditsRef.current.clear();

    setSaving(true);
    setSaveStatus("saving");

    try {
      const transaction = client.transaction();

      for (const [key, edits] of pending) {
        const [docType, docId] = key.split("|");
        const pubId = docId.replace(/^drafts\./, "");
        const draftId = `drafts.${pubId}`;

        // Get base document for createIfNotExists
        let baseDoc: Record<string, unknown> | null = null;
        if (docType === "homepage") {
          baseDoc = homepageState.draft ?? homepageState.published;
        } else if (docType === "homepageAbout") {
          baseDoc = aboutState.draft ?? aboutState.published;
        } else if (docType === "siteSettings") {
          baseDoc = settingsState.draft ?? settingsState.published;
        } else if (docType === "sidebar") {
          baseDoc = sidebarState.draft ?? sidebarState.published;
        } else if (docType === "homepageFeatured") {
          baseDoc = featuredState.draft ?? featuredState.published;
        } else if (docType === "category") {
          const catState = categoriesState.get(pubId);
          baseDoc = catState?.draft ?? catState?.published ?? null;
        }

        if (!baseDoc) continue;

        transaction.createIfNotExists({
          ...baseDoc,
          _id: draftId,
          _type: baseDoc._type ?? docType,
        } as any);
        transaction.patch(draftId, (p) => p.set(edits));
      }

      await transaction.commit();

      // Refresh drafts after save
      const refreshes = [];
      for (const [key] of pending) {
        const [docType, docId] = key.split("|");
        const pubId = docId.replace(/^drafts\./, "");
        const draftId = `drafts.${pubId}`;

        if (docType === "homepage") {
          refreshes.push(
            client.fetch<HomepageData | null>(`*[_id == $id][0]`, { id: draftId }).then((draft) => {
              setHomepageState((prev) => ({ ...prev, draft, edits: {} }));
            }),
          );
        } else if (docType === "homepageAbout") {
          refreshes.push(
            client
              .fetch<HomepageAboutData | null>(`*[_id == $id][0]`, { id: draftId })
              .then((draft) => {
                setAboutState((prev) => ({ ...prev, draft, edits: {} }));
              }),
          );
        } else if (docType === "siteSettings") {
          refreshes.push(
            client
              .fetch<SiteSettingsData | null>(`*[_id == $id][0]`, { id: draftId })
              .then((draft) => {
                setSettingsState((prev) => ({ ...prev, draft, edits: {} }));
              }),
          );
        } else if (docType === "sidebar") {
          refreshes.push(
            client.fetch<SidebarData | null>(`*[_id == $id][0]`, { id: draftId }).then((draft) => {
              setSidebarState((prev) => ({ ...prev, draft, edits: {} }));
            }),
          );
        } else if (docType === "homepageFeatured") {
          refreshes.push(
            client
              .fetch<HomepageFeaturedData | null>(`*[_id == $id][0]`, { id: draftId })
              .then((draft) => {
                setFeaturedState((prev) => ({ ...prev, draft, edits: {} }));
              }),
          );
        } else if (docType === "category") {
          refreshes.push(
            client.fetch<CategoryData | null>(`*[_id == $id][0]`, { id: draftId }).then((draft) => {
              setCategoriesState((prev) => {
                const next = new Map(prev);
                const existing = next.get(pubId);
                if (existing) next.set(pubId, { ...existing, draft, edits: {} });
                return next;
              });
            }),
          );
        }
      }
      await Promise.all(refreshes);
      setSaveStatus("saved");
    } catch (err) {
      console.error("Save failed:", err);
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }, [
    client,
    homepageState,
    aboutState,
    settingsState,
    sidebarState,
    featuredState,
    categoriesState,
  ]);

  // ── updateField — routes edits to correct doc ────

  const updateField = useCallback(
    (docType: DocType, docId: string, field: string, value: unknown) => {
      const pubId = docId.replace(/^drafts\./, "");
      const key = `${docType}|${pubId}`;

      // Update local edits
      if (docType === "homepage") {
        setHomepageState((prev) => ({ ...prev, edits: { ...prev.edits, [field]: value } }));
      } else if (docType === "homepageAbout") {
        setAboutState((prev) => ({ ...prev, edits: { ...prev.edits, [field]: value } }));
      } else if (docType === "siteSettings") {
        setSettingsState((prev) => ({ ...prev, edits: { ...prev.edits, [field]: value } }));
      } else if (docType === "sidebar") {
        setSidebarState((prev) => ({ ...prev, edits: { ...prev.edits, [field]: value } }));
      } else if (docType === "homepageFeatured") {
        setFeaturedState((prev) => ({ ...prev, edits: { ...prev.edits, [field]: value } }));
      } else if (docType === "category") {
        setCategoriesState((prev) => {
          const next = new Map(prev);
          const existing = next.get(pubId);
          if (existing)
            next.set(pubId, { ...existing, edits: { ...existing.edits, [field]: value } });
          return next;
        });
      }

      // Track pending edits
      const existing = pendingEditsRef.current.get(key) ?? {};
      pendingEditsRef.current.set(key, { ...existing, [field]: value });

      setSaveStatus("dirty");

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => saveToSanity(), 1500);
    },
    [saveToSanity],
  );

  // ── Publish all ──────────────────────────────────

  async function handlePublish() {
    // Flush any pending saves first
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (pendingEditsRef.current.size > 0) {
      await saveToSanity();
    }

    setSaving(true);
    setSaveStatus("saving");
    try {
      const transaction = client.transaction();
      const toRefresh: Array<{ type: DocType; pubId: string; draftId: string }> = [];

      // Helper to publish a single doc
      function queuePublish(docType: DocType, published: any, draft: any) {
        if (!draft) return;
        const pubId = draft._id.replace(/^drafts\./, "");
        const { _rev, _updatedAt, ...rest } = draft;
        transaction.createOrReplace({ ...rest, _id: pubId, _type: draft._type });
        transaction.delete(`drafts.${pubId}`);
        toRefresh.push({ type: docType, pubId, draftId: `drafts.${pubId}` });
      }

      queuePublish("homepage", homepageState.published, homepageState.draft);
      queuePublish("homepageAbout", aboutState.published, aboutState.draft);
      queuePublish("homepageFeatured", featuredState.published, featuredState.draft);
      queuePublish("siteSettings", settingsState.published, settingsState.draft);
      queuePublish("sidebar", sidebarState.published, sidebarState.draft);
      for (const [pubId, catState] of categoriesState) {
        queuePublish("category", catState.published, catState.draft);
      }

      if (toRefresh.length === 0) {
        setSaveStatus("saved");
        setSaving(false);
        return;
      }

      await transaction.commit();

      // Refresh all published docs, clear drafts
      for (const { type, pubId } of toRefresh) {
        if (type === "homepage") {
          const pub = await client.fetch<HomepageData | null>(`*[_id == $id][0]`, { id: pubId });
          setHomepageState({ published: pub, draft: null, edits: {} });
        } else if (type === "homepageAbout") {
          const pub = await client.fetch<HomepageAboutData | null>(`*[_id == $id][0]`, {
            id: pubId,
          });
          setAboutState({ published: pub, draft: null, edits: {} });
        } else if (type === "siteSettings") {
          const pub = await client.fetch<SiteSettingsData | null>(`*[_id == $id][0]`, {
            id: pubId,
          });
          setSettingsState({ published: pub, draft: null, edits: {} });
        } else if (type === "sidebar") {
          const pub = await client.fetch<SidebarData | null>(`*[_id == $id][0]`, { id: pubId });
          setSidebarState({ published: pub, draft: null, edits: {} });
        } else if (type === "homepageFeatured") {
          const pub = await client.fetch<HomepageFeaturedData | null>(`*[_id == $id][0]`, {
            id: pubId,
          });
          setFeaturedState({ published: pub, draft: null, edits: {} });
        } else if (type === "category") {
          const pub = await client.fetch<CategoryData | null>(`*[_id == $id][0]`, { id: pubId });
          setCategoriesState((prev) => {
            const next = new Map(prev);
            next.set(pubId, { published: pub, draft: null, edits: {} });
            return next;
          });
        }
      }

      setSaveStatus("saved");
    } catch (err) {
      console.error("Publish failed:", err);
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }

  // ── Check if any drafts exist ────────────────────

  const hasAnyDrafts = useMemo(() => {
    if (homepageState.draft) return true;
    if (aboutState.draft) return true;
    if (featuredState.draft) return true;
    if (settingsState.draft) return true;
    if (sidebarState.draft) return true;
    for (const [, state] of categoriesState) {
      if (state.draft) return true;
    }
    return false;
  }, [homepageState, aboutState, featuredState, settingsState, sidebarState, categoriesState]);

  // ── Status labels ────────────────────────────────

  const statusLabel: Record<string, string> = {
    saved: "保存済み",
    dirty: "未保存",
    saving: "保存中…",
    error: "保存エラー",
  };
  const statusTone: Record<string, string> = {
    saved: "var(--card-muted-fg-color)",
    dirty: "#b08000",
    saving: "var(--card-muted-fg-color)",
    error: "#cc3333",
  };

  // ── Render ───────────────────────────────────────

  if (loading) {
    return (
      <Flex align="center" justify="center" style={{ height: "100%" }}>
        <LoadingDots />
      </Flex>
    );
  }

  if (!homepage || !siteSettings) {
    return (
      <Flex align="center" justify="center" style={{ height: "100%" }}>
        <Text size={1} muted>
          ホームページデータが見つかりません
        </Text>
      </Flex>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <Box
        padding={3}
        style={{ borderBottom: "1px solid var(--card-border-color)", flexShrink: 0 }}
      >
        <Flex align="center" justify="space-between">
          <Flex align="center" gap={2}>
            <Text size={1} weight="semibold">
              ホームページ
            </Text>
            <Text size={0} style={{ color: statusTone[saveStatus] }}>
              {statusLabel[saveStatus]}
            </Text>
          </Flex>
          <Button
            icon={PublishIcon}
            text="すべて公開"
            tone="positive"
            fontSize={1}
            padding={2}
            onClick={handlePublish}
            disabled={saving || !hasAnyDrafts}
          />
        </Flex>
      </Box>

      {/* Section nav (sticky) */}
      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: "1px solid var(--card-border-color)",
          background: "var(--card-bg-color)",
          flexShrink: 0,
        }}
      >
        {SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setActiveSection(id);
              clickedSectionRef.current = id;
              const el = document.getElementById(id);
              el?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            style={{
              flex: 1,
              padding: "8px 0",
              border: "none",
              borderBottom:
                activeSection === id
                  ? "2px solid var(--card-focus-ring-color, #4a90d9)"
                  : "2px solid transparent",
              background: "transparent",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: activeSection === id ? 600 : 400,
              color: activeSection === id ? "var(--card-fg-color)" : "var(--card-muted-fg-color)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Scrollable editor body */}
      <div ref={scrollRef} style={{ flex: 1, overflow: "auto" }}>
        <div style={{ maxWidth: 720, width: "100%", margin: "0 auto", padding: "16px 16px" }}>
          <HeroSection
            homepage={homepage}
            siteSettings={siteSettings}
            updateField={updateField}
            onOpenImagePicker={onOpenImagePicker}
            onShowHotspotCrop={onShowHotspotCrop}
          />

          <ProgramCardsSection
            featured={featured}
            categories={categories}
            navCategories={navCategories}
            allPages={allPages}
            updateField={updateField}
          />

          {about && (
            <AboutSection
              about={about}
              aboutId={aboutId}
              updateField={updateField}
              onOpenImagePicker={onOpenImagePicker}
              onShowHotspotCrop={onShowHotspotCrop}
            />
          )}

          <ActivityGridSection
            homepage={homepage}
            updateField={updateField}
            onOpenImagePicker={onOpenImagePicker}
            onShowHotspotCrop={onShowHotspotCrop}
          />

          <SettingsSection
            siteSettings={siteSettings}
            sidebar={sidebar}
            updateField={updateField}
            onOpenFilePicker={onOpenFilePicker}
            onOpenDocumentDetail={onOpenDocumentDetail}
          />
        </div>
      </div>

      <RawJsonButton
        getDocument={() => ({
          homepage: homepageState,
          about: aboutState,
          featured: featuredState,
          settings: settingsState,
          sidebar: sidebarState,
        })}
      />
    </div>
  );
}
