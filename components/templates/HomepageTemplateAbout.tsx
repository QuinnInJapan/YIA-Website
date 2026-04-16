import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { getSiteData, getHomepageFeatured } from "@/lib/data";
import { fetchHomepageAbout } from "@/lib/sanity/queries";
import { ja, en } from "@/lib/i18n";
import { imageUrl, hotspotPosition } from "@/lib/sanity/image";
import { formatDateDot } from "@/lib/date-format";
import SiteFooter from "@/components/SiteFooter";
import AccessSection from "@/components/AccessSection";
import HomepageEffects from "@/components/HomepageEffects";
import LazyImage from "@/components/LazyImage";
import HomepageActivityGrid from "./HomepageActivityGrid";

/**
 * Variant C — identical to the current homepage except the event flyers
 * section is replaced with an "About YIA" mission block + framed photo.
 */
export default async function HomepageTemplateAbout() {
  const data = await getSiteData();
  const hp = data.homepage;
  const featured = await getHomepageFeatured();
  const sidebar = data.sidebar;
  const heroImage = imageUrl(hp.hero.image);
  const heroPosition = hotspotPosition(hp.hero.image);

  // Announcements: pinned first, then by date, show 5
  const hpAnnouncements = [...(data.announcements ?? [])]
    .sort(
      (a, b) =>
        (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.date ?? "").localeCompare(a.date ?? ""),
    )
    .slice(0, 5);

  // Fetch "About YIA" content — falls back to hardcoded defaults
  const about = await fetchHomepageAbout();
  const aboutImage = about?.image ? imageUrl(about.image) : null;
  const aboutImagePos = about?.image ? hotspotPosition(about.image) : null;
  const aboutAlt = "YIA活動の様子";
  // Fallback to activity grid image if no dedicated photo uploaded yet
  const framedPhoto =
    aboutImage ?? (hp.activityGrid?.images?.[0] ? imageUrl(hp.activityGrid.images[0]) : null);
  const framedPhotoPos = aboutImage ? aboutImagePos : null;

  const bodyJa =
    about?.bodyJa ??
    "横須賀国際交流協会（YIA）は、横須賀市における多文化共生社会の実現を目指し、国際交流・国際協力・在住外国人支援の三つの柱で活動しています。日本語教室、文化交流イベント、生活相談など、地域に根ざした多様なプログラムを通じて、すべての人が安心して暮らせるまちづくりに貢献しています。";
  const bodyEn =
    about?.bodyEn ??
    "The Yokosuka International Association (YIA) works toward a multicultural society in Yokosuka through international exchange, cooperation, and support for foreign residents. From Japanese language classes and cultural events to daily-life consultations, our community-rooted programs help everyone feel at home.";

  return (
    <HomepageEffects>
      <section className="hero-viewport">
        {heroImage && (
          <Image
            src={heroImage}
            alt=""
            fill
            priority
            fetchPriority="high"
            sizes="100vw"
            className="hero-viewport__img"
            style={heroPosition ? { objectPosition: heroPosition } : undefined}
          />
        )}
        <div className="hero__overlay">
          <h1 className="hero__title">{ja(data.site.org.name)}</h1>
          <p className="hero__subtitle" lang="en" translate="no">
            {en(data.site.org.name)}
          </p>
          <p className="hero__tagline">{ja(hp.hero.tagline)}</p>
          <p className="hero__tagline-en" lang="en" translate="no">
            {en(hp.hero.tagline)}
          </p>
        </div>
      </section>

      <main id="main">
        {/* Announcements band */}
        <section className="oshirase-band reveal">
          <div className="oshirase-inner">
            <h2 className="home-section__heading reveal">
              お知らせ
              <small lang="en" translate="no">
                Announcements
              </small>
            </h2>
            <div className="oshirase-list reveal-stagger">
              {hpAnnouncements.map((a, i) => {
                const d = a.date || "";
                const dateDisplay = d ? formatDateDot(d) : "";
                return (
                  <Link
                    href={`/announcements/${a.slug || a._id}`}
                    className="oshirase-item reveal"
                    style={{ "--reveal-i": i } as React.CSSProperties}
                    key={a._id}
                  >
                    <span className="oshirase-date">
                      {dateDisplay}
                      {a.pinned && <span className="oshirase-pin">固定 Pinned</span>}
                    </span>
                    <span className="oshirase-title">
                      <span className="oshirase-title__ja">{ja(a.title)}</span>
                      <span className="oshirase-title__en" lang="en" translate="no">
                        {en(a.title)}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
            <div
              className="oshirase-footer reveal"
              style={
                {
                  "--reveal-i": hpAnnouncements.length,
                } as React.CSSProperties
              }
            >
              <Link href="/announcements" className="oshirase-viewall">
                <span className="oshirase-viewall__ja">すべてのお知らせを見る</span>
                <span className="oshirase-viewall__en" lang="en" translate="no">
                  View All Announcements →
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Program card grid — driven by homepageFeatured slots */}
        <section className="program-grid reveal-stagger">
          {featured.map((card, i) => {
            const img = imageUrl(card.heroImage);
            const pos = hotspotPosition(card.heroImage);
            return (
              <div
                className="program-card reveal"
                style={{ "--reveal-i": i } as React.CSSProperties}
                key={card.categoryId}
              >
                {img && (
                  <LazyImage
                    src={img}
                    alt=""
                    className="program-card__img"
                    fill
                    style={pos ? { objectPosition: pos } : undefined}
                  />
                )}
                <div className="program-card__overlay">
                  <Link href={card.categoryUrl} className="program-card__heading-link">
                    <h3 className="program-card__title">{ja(card.label)}</h3>
                    <span className="program-card__title-en" lang="en" translate="no">
                      {en(card.label)}
                    </span>
                  </Link>
                  <div className="program-card__links">
                    {card.pages.map((pg) => (
                      <Link href={pg.url} className="program-card__link" key={pg.id}>
                        <span className="program-card__link-ja">{ja(pg.title)}</span>
                        <span className="program-card__link-en" lang="en" translate="no">
                          {en(pg.title)}
                        </span>
                      </Link>
                    ))}
                  </div>
                  <Link href={card.categoryUrl} className="program-card__see-all">
                    <span className="program-card__see-all-ja">すべて見る</span>
                    <span className="program-card__see-all-en" lang="en" translate="no">
                      See All &rarr;
                    </span>
                  </Link>
                </div>
              </div>
            );
          })}
        </section>

        {/* About YIA — replaces event flyers */}
        <section className="home-section home-section--tinted home-section--mission reveal">
          {heroImage && (
            <Image
              src={heroImage}
              alt=""
              fill
              sizes="100vw"
              className="home-section--mission__bg"
              style={heroPosition ? { objectPosition: heroPosition } : undefined}
            />
          )}
          <div className="about-showcase reveal">
            {framedPhoto && (
              <figure className="about-showcase__photo">
                <Image
                  src={framedPhoto}
                  alt={aboutAlt}
                  width={480}
                  height={640}
                  className="about-showcase__img"
                  style={framedPhotoPos ? { objectPosition: framedPhotoPos } : undefined}
                />
              </figure>
            )}
            <div className="mission-block">
              <h2 className="home-section__heading">
                {about?.titleJa}
                <small lang="en" translate="no">
                  {about?.titleEn}
                </small>
              </h2>
              <p className="mission-block__ja">{bodyJa}</p>
              <p className="mission-block__en" lang="en" translate="no">
                {bodyEn}
              </p>
              <Link href="/about" className="mission-block__link">
                <span className="mission-block__link-ja">もっと詳しく</span>
                <span className="mission-block__link-en" lang="en" translate="no">
                  Learn More
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Activity mosaic grid — streamed via Suspense */}
        <Suspense>
          <HomepageActivityGrid />
        </Suspense>

        <Suspense>
          <AccessSection />
        </Suspense>
      </main>

      <SiteFooter documents={sidebar.documents} />
    </HomepageEffects>
  );
}
