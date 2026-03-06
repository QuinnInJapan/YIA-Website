import Image from "next/image";
import Link from "next/link";
import { stegaClean } from "next-sanity";
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
import HomepageEffects from "@/components/HomepageEffects";
import LazyImage from "@/components/LazyImage";

export default async function HomepageTemplateAlt() {
  const data = await getSiteData();
  const hp = data.homepage;
  const nav = await getEnrichedNavigation();
  const sidebar = data.sidebar;
  const heroImage = imageUrl(hp.hero.image);
  const heroPosition = hotspotPosition(hp.hero.image);

  // Announcements dereferenced by GROQ
  const hpAnnouncements = hp.announcementRefs ?? [];

  // Activity mosaic
  const gridStat = hp.activityGrid.stat;

  return (
    <HomepageEffects>
      <section className="hero-viewport">
        {heroImage && (
          <Image
            src={heroImage}
            alt=""
            fill
            priority
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
                    <time className="oshirase-date" dateTime={d}>
                      {dateDisplay}
                    </time>
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

        {/* Mission bands — full-bleed image, statement is the focus */}
        {nav.categories.filter((cat) => cat.heroImage?.asset?._ref).map((cat, i) => {
          const img = imageUrl(cat.heroImage);
          const pos = hotspotPosition(cat.heroImage);
          return (
            <section
              className="program-band reveal"
              key={cat.id}
            >
              <div className="program-band__bg-wrap">
                {img && (
                  <LazyImage
                    src={img}
                    alt=""
                    fill
                    className="program-band__bg"
                    style={pos ? { objectPosition: pos } : undefined}
                  />
                )}
              </div>
              {cat.description && (
                <div className="program-band__text">
                  <p className="program-band__ja">{ja(cat.description)}</p>
                  <p className="program-band__en" lang="en">{en(cat.description)}</p>
                </div>
              )}
            </section>
          );
        })}

        {/* Culmination + next steps — merged into one closing screen */}
        <section className="culmination culmination--card reveal">
          <div
            className="culmination__stat"
            data-counter={gridStat.value}
          >
            <span className="culmination__stat-number">
              {gridStat.value}<span className="culmination__stat-plus">+</span>
            </span>
            <span className="culmination__stat-label">
              {ja(gridStat.label)}
            </span>
            <span className="culmination__stat-label-en" lang="en">
              {en(gridStat.label)}
            </span>
          </div>
          <nav className="next-steps__inner">
            <Link href="/aboutyia" className="next-steps__path reveal" style={{ "--reveal-i": 0 } as React.CSSProperties}>
              <span className="next-steps__path-ja">YIAについて</span>
              <span className="next-steps__path-en" lang="en">About YIA</span>
            </Link>
            {sidebar.memberRecruitment.slug && (
              <Link
                href={`/${stegaClean(sidebar.memberRecruitment.slug)}`}
                className="next-steps__path reveal"
                style={{ "--reveal-i": 1 } as React.CSSProperties}
              >
                <span className="next-steps__path-ja">参加する</span>
                <span className="next-steps__path-en" lang="en">Join Us</span>
              </Link>
            )}
            <a href="#access" className="next-steps__path reveal" style={{ "--reveal-i": 2 } as React.CSSProperties}>
              <span className="next-steps__path-ja">お問い合わせ</span>
              <span className="next-steps__path-en" lang="en">Contact</span>
            </a>
          </nav>
        </section>

        <AccessSection />
      </main>

      <SiteFooter documents={sidebar.documents} />
    </HomepageEffects>
  );
}
