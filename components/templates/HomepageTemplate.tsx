import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  getSiteData,
  getEnrichedNavigation,
  shortId,
} from "@/lib/data";
import { ja, en } from "@/lib/i18n";
import { imageUrl, hotspotPosition } from "@/lib/sanity/image";
import { formatDateDot } from "@/lib/date-format";
import SiteFooter from "@/components/SiteFooter";
import AccessSection from "@/components/AccessSection";
import EventFlyerPairWrapper from "@/components/EventFlyerPairWrapper";
import HomepageEffects from "@/components/HomepageEffects";
import LazyImage from "@/components/LazyImage";
import HomepageActivityGrid from "./HomepageActivityGrid";

export default async function HomepageTemplate() {
  const data = await getSiteData();
  const hp = data.homepage;
  const nav = await getEnrichedNavigation();
  const sidebar = data.sidebar;
  const heroImage = imageUrl(hp.hero.image);
  const heroPosition = hotspotPosition(hp.hero.image);

  // Announcements dereferenced by GROQ
  const hpAnnouncements = hp.announcementRefs ?? [];

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
          <p className="hero__subtitle" lang="en">{en(data.site.org.name)}</p>
          <p className="hero__tagline">{ja(hp.hero.tagline)}</p>
          <p className="hero__tagline-en" lang="en">{en(hp.hero.tagline)}</p>
        </div>
      </section>

      <main id="main">
        {/* Announcements band */}
        <section className="oshirase-band reveal">
          <div className="oshirase-inner">
            <h2 className="home-section__heading reveal">
              お知らせ<small lang="en">Announcements</small>
            </h2>
            <div className="oshirase-list reveal-stagger">
              {hpAnnouncements.map((a, i) => {
                const d = a.date || "";
                const dateDisplay = d ? formatDateDot(d) : "";
                return (
                  <Link
                    href={`/announcements#${shortId(a._id)}`}
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
                      <span className="oshirase-title__en" lang="en">{en(a.title)}</span>
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
                <span className="oshirase-viewall__en" lang="en">View All Announcements →</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Program card grid */}
        <section className="program-grid reveal-stagger">
          {nav.categories.filter((cat) => cat.heroImage?.asset?._ref).map((cat, i) => {
            const img = imageUrl(cat.heroImage);
            const pos = hotspotPosition(cat.heroImage);
            return (
              <div
                className="program-card reveal"
                style={{ "--reveal-i": i } as React.CSSProperties}
                key={cat.id}
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
                  <Link href={`/${cat.categoryId}`} className="program-card__heading-link">
                    <h3 className="program-card__title">{ja(cat.label)}</h3>
                    <span className="program-card__title-en" lang="en">
                      {en(cat.label)}
                    </span>
                  </Link>
                  <div className="program-card__links">
                    {cat.items.map((it) => (
                      <Link
                        href={it.url}
                        className="program-card__link"
                        key={it.id}
                      >
                        <span className="program-card__link-ja">{ja(it.title)}</span>
                        <span className="program-card__link-en" lang="en">
                          {en(it.title)}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Event flyers */}
        {hp.eventFlyers && hp.eventFlyers.length > 0 && (
          <section
            className="home-section home-section--tinted home-section--events reveal"
          >
            {heroImage && (
              <Image
                src={heroImage}
                alt=""
                fill
                sizes="100vw"
                className="home-section--events__bg"
                style={heroPosition ? { objectPosition: heroPosition } : undefined}
              />
            )}
            <h2 className="home-section__heading reveal">
              イベント<small lang="en">Upcoming Events</small>
            </h2>
            <div className="flyer-showcase reveal">
              <EventFlyerPairWrapper flyers={hp.eventFlyers} />
            </div>
          </section>
        )}

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
