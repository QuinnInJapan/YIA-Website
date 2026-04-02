"use client";

import { ja, en } from "@/lib/i18n";
import { imageUrl, hotspotPosition } from "@/lib/sanity/image";
import { formatDateDot } from "@/lib/date-format";
import type {
  HomepageData,
  HomepageAboutData,
  HomepageFeaturedData,
  SiteSettingsData,
  SidebarData,
  CategoryData,
  NavCategoryData,
  AnnouncementPreviewData,
} from "./types";

export interface HomepageMergedState {
  homepage: HomepageData;
  about: HomepageAboutData | null;
  siteSettings: SiteSettingsData;
  sidebar: SidebarData | null;
  categories: CategoryData[];
  navCategories: NavCategoryData[];
  announcements: AnnouncementPreviewData[];
  featured: HomepageFeaturedData | null;
}

export function HomepagePreview({ state }: { state: HomepageMergedState }) {
  const {
    homepage: hp,
    about,
    siteSettings,
    sidebar,
    categories,
    navCategories,
    announcements,
    featured,
  } = state;
  const contact = siteSettings.contact as any;
  const org = siteSettings.org as any;

  const heroSrc = imageUrl(hp.hero?.image as any);
  const heroPosition = hotspotPosition(hp.hero?.image as any);
  const aboutImgSrc = about?.image ? imageUrl(about.image as any) : "";
  const aboutImgPos = about?.image ? hotspotPosition(about.image as any) : undefined;
  const featuredCategoryRefs = featured?.categories ?? [];
  const images = (hp.activityGrid?.images as any[]) ?? [];
  const stat = hp.activityGrid?.stat;

  function renderActivityGrid() {
    if (images.length === 0) return null;
    function GridImage({ index, area }: { index: number; area: string }) {
      const img = images[index];
      if (!img) return <div style={{ gridArea: area, background: "#e8e8e8" }} />;
      const src = imageUrl(img);
      const pos = hotspotPosition(img);
      return src ? (
        <figure style={{ gridArea: area, position: "relative", overflow: "hidden", margin: 0 }}>
          <img
            src={src}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              ...(pos ? { objectPosition: pos } : {}),
            }}
          />
        </figure>
      ) : (
        <div style={{ gridArea: area, background: "#e8e8e8" }} />
      );
    }
    return (
      <section className="activity-grid-wrap">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gridTemplateRows: "repeat(3, 120px)",
            gridTemplateAreas: `
              "a a b c"
              "d e e f"
              "g h h i"
            `,
            gap: 2,
          }}
        >
          <GridImage index={0} area="a" />
          <div
            style={{
              gridArea: "b",
              background: "#1b2e4a",
              color: "#fff",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
            }}
          >
            {stat?.value && (
              <>
                <strong style={{ fontSize: 28, fontWeight: 900 }}>{stat.value}</strong>
                <span style={{ fontSize: 11, opacity: 0.8 }}>{ja(stat.label)}</span>
              </>
            )}
          </div>
          <GridImage index={1} area="c" />
          <GridImage index={2} area="d" />
          <div
            style={{
              gridArea: "e",
              background: "#c8a84e",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <div style={{ textAlign: "center", lineHeight: 1.4 }}>
              入会案内
              <span style={{ display: "block", fontSize: 12, fontWeight: 400, opacity: 0.85 }}>
                Join Us
              </span>
            </div>
          </div>
          <GridImage index={3} area="f" />
          <div
            style={{
              gridArea: "g",
              background: "#0f1e33",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            <div style={{ textAlign: "center", lineHeight: 1.4 }}>
              活動ブログ
              <span style={{ display: "block", fontSize: 12, fontWeight: 400, opacity: 0.85 }}>
                Activity Blog
              </span>
            </div>
          </div>
          <GridImage index={4} area="h" />
          <GridImage index={5} area="i" />
        </div>
      </section>
    );
  }

  function renderProgramGrid() {
    if (featuredCategoryRefs.length === 0) return null;
    return (
      <section className="program-grid">
        {featuredCategoryRefs.map((ref, i) => {
          const catId = ref._ref;
          const cat = categories.find((c) => c._id === catId || c._id === `drafts.${catId}`);
          if (!cat) return null;
          const img = imageUrl(cat.heroImage as any);
          const pos = hotspotPosition(cat.heroImage as any);
          const navCat = navCategories.find((nc) => nc.categoryId === catId);
          const pageItems = navCat?.items ?? [];
          return (
            <div className="program-card" key={catId || i}>
              {img && (
                <img
                  src={img}
                  alt=""
                  className="program-card__img"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    ...(pos ? { objectPosition: pos } : {}),
                  }}
                />
              )}
              <div className="program-card__overlay">
                <h3 className="program-card__title">{ja(cat.label)}</h3>
                <span className="program-card__title-en" lang="en" translate="no">
                  {en(cat.label)}
                </span>
                {pageItems.length > 0 && (
                  <div className="program-card__links">
                    {pageItems.map((item, j) => (
                      <span className="program-card__link" key={j}>
                        <span className="program-card__link-ja">{ja(item?.title)}</span>
                        <span className="program-card__link-en" lang="en" translate="no">
                          {en(item?.title)}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
                <span className="program-card__see-all">
                  <span className="program-card__see-all-ja">すべて見る</span>
                  <span className="program-card__see-all-en" lang="en" translate="no">
                    See All →
                  </span>
                </span>
              </div>
            </div>
          );
        })}
      </section>
    );
  }

  return (
    <div
      style={{
        background: "#fff",
        color: "#333",
        overflowY: "auto",
        height: "100%",
        fontSize: 16,
        fontFamily: "var(--font-body)",
        lineHeight: 1.7,
      }}
    >
      {/* Hero section */}
      <section className="hero-viewport" style={{ position: "relative", minHeight: 300 }}>
        {heroSrc && (
          <img
            src={heroSrc}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              ...(heroPosition ? { objectPosition: heroPosition } : {}),
            }}
          />
        )}
        <div className="hero__overlay">
          <h1 className="hero__title">{ja(siteSettings.org?.name)}</h1>
          <p className="hero__subtitle" lang="en" translate="no">
            {en(siteSettings.org?.name)}
          </p>
          <p className="hero__tagline">{ja(hp.hero?.tagline)}</p>
          <p className="hero__tagline-en" lang="en" translate="no">
            {en(hp.hero?.tagline)}
          </p>
        </div>
      </section>

      <main id="preview-main">
        {/* Announcements band */}
        {announcements.length > 0 && (
          <section className="oshirase-band">
            <div className="oshirase-inner">
              <h2 className="home-section__heading">
                お知らせ
                <small lang="en" translate="no">
                  Announcements
                </small>
              </h2>
              <div className="oshirase-list">
                {announcements.map((a) => {
                  const dateStr = a.date ? formatDateDot(a.date) : "";
                  return (
                    <div className="oshirase-item" key={a._id}>
                      <span className="oshirase-date">
                        {dateStr}
                        {a.pinned && <span className="oshirase-pin">固定 Pinned</span>}
                      </span>
                      <span className="oshirase-title">
                        <span className="oshirase-title__ja">{ja(a.title)}</span>
                        <span className="oshirase-title__en" lang="en" translate="no">
                          {en(a.title)}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Program card grid */}
        {renderProgramGrid()}

        {/* About section */}
        {about && (
          <section className="home-section home-section--about">
            <h2 className="home-section__heading">
              {about.titleJa || "YIAとは"}
              <small lang="en" translate="no">
                {about.titleEn || "About YIA"}
              </small>
            </h2>
            <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
              {aboutImgSrc && (
                <img
                  src={aboutImgSrc}
                  alt=""
                  style={{
                    width: 200,
                    height: 200,
                    objectFit: "cover",
                    borderRadius: 8,
                    flexShrink: 0,
                    ...(aboutImgPos ? { objectPosition: aboutImgPos } : {}),
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: 200 }}>
                {about.bodyJa && <p style={{ whiteSpace: "pre-wrap" }}>{about.bodyJa}</p>}
                {about.bodyEn && (
                  <p lang="en" translate="no" style={{ whiteSpace: "pre-wrap", marginTop: 12 }}>
                    {about.bodyEn}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Activity grid */}
        {renderActivityGrid()}

        {/* Access section */}
        <section className="home-section home-section--tinted">
          <h2 className="home-section__heading">
            アクセス
            <small lang="en" translate="no">
              Access
            </small>
          </h2>
          <div className="access-block">
            <div className="access-block__map">
              {siteSettings.googleMapsEmbedUrl ? (
                <iframe
                  src={siteSettings.googleMapsEmbedUrl as string}
                  style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                  title="Map"
                  loading="lazy"
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: 200,
                    background: "#e8e8e8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#999",
                    fontSize: 13,
                  }}
                >
                  マップURL未設定
                </div>
              )}
            </div>
            <div className="access-block__info">
              <p className="access-block__name">
                <span className="access-block__designation">
                  {(org?.designation as string) ?? ""}
                </span>
                {ja(org?.name)}
              </p>
              <div className="access-block__address">
                <p>
                  〒{(contact?.postalCode as string) ?? ""} {ja(contact?.address)}
                </p>
                <p className="access-block__address-en" lang="en" translate="no">
                  {en(contact?.address)}
                </p>
              </div>
              <div className="access-block__hours">
                <p>{ja(siteSettings.businessHours as any)}</p>
                <p className="access-block__hours-en" lang="en" translate="no">
                  {en(siteSettings.businessHours as any)}
                </p>
              </div>
              <div className="access-block__contact">
                <p>TEL {(contact?.tel as string) ?? ""}</p>
                <p>FAX {(contact?.fax as string) ?? ""}</p>
                <p>{(contact?.email as string) ?? ""}</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="site-footer">
        {sidebar?.documents && (sidebar.documents as any[]).length > 0 && (
          <div className="site-footer__docs">
            <div className="site-footer__docs-title">公開資料 Documents</div>
            <div className="site-footer__docs-links">
              {(sidebar.documents as any[]).map((d: any, i: number) => (
                <span key={d._key ?? i}>
                  {i > 0 && <span className="site-footer__docs-sep">&middot;</span>} {ja(d.label)}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="site-footer__updated">
          最終更新日 Last Updated: {(org?.lastUpdated as string) ?? ""}
        </div>
        <div className="site-footer__copyright">
          &copy;{" "}
          <span lang="en" translate="no">
            {en(org?.name)}
          </span>{" "}
          ({(org?.abbreviation as string) ?? ""})
        </div>
      </footer>
    </div>
  );
}
