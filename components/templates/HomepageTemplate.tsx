import Image from "next/image";
import Link from "next/link";
import { stegaClean } from "next-sanity";
import {
  getSiteData,
  getEnrichedNavigation,
  getAnnouncementsByRefs,
} from "@/lib/data";
import { ja, en } from "@/lib/i18n";
import { imageUrl } from "@/lib/sanity/image";
import { formatDateDot } from "@/lib/date-format";
import SiteFooter from "@/components/SiteFooter";
import EventFlyerPairWrapper from "@/components/EventFlyerPairWrapper";
import HomepageEffects from "@/components/HomepageEffects";
import LazyImage from "@/components/LazyImage";

export default async function HomepageTemplate() {
  const data = await getSiteData();
  const hp = data.homepage;
  const nav = await getEnrichedNavigation();
  const sidebar = data.sidebar;
  const heroImage = imageUrl(hp.hero.image);

  // Inline announcements list
  const hpAnnouncements = await getAnnouncementsByRefs(hp.announcementRefs);

  // Activity mosaic
  const galleryImages = hp.activityGrid.images;
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
          />
        )}
        <div className="hero__overlay">
          <h1 className="hero__title">{ja(data.site.org.name)}</h1>
          <p className="hero__subtitle">{en(data.site.org.name)}</p>
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
                    href={`/announcements#${stegaClean(a.id)}`}
                    className="oshirase-item reveal"
                    style={{ "--reveal-i": i } as React.CSSProperties}
                    key={a.id}
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

        {/* Program card grid */}
        <section className="program-grid reveal-stagger">
          {nav.categories.filter((cat) => cat.heroImage?.asset?._ref).map((cat, i) => {
            const img = imageUrl(cat.heroImage);
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
                  />
                )}
                <div className="program-card__overlay">
                  <h3 className="program-card__title">{ja(cat.label)}</h3>
                  <span className="program-card__title-en" lang="en">
                    {en(cat.label)}
                  </span>
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

        {/* Activity mosaic grid */}
        <section className="activity-grid-wrap">
          <div className="activity-grid reveal-stagger">
            <figure
              className="activity-grid__item reveal"
              style={
                { gridArea: "a", "--reveal-i": 0 } as React.CSSProperties
              }
            >
              <LazyImage
                src={imageUrl(galleryImages[0])}
                alt=""
                loading="lazy"
                fill
              />
            </figure>
            <div
              className="activity-grid__tile activity-grid__tile--navy reveal"
              style={
                { gridArea: "b", "--reveal-i": 1 } as React.CSSProperties
              }
              data-counter={gridStat.value}
            >
              <div className="activity-grid__tile-big">
                {gridStat.value}+
              </div>
              <div className="activity-grid__tile-text">
                {ja(gridStat.label)}
                <span>{en(gridStat.label)}</span>
              </div>
            </div>
            <figure
              className="activity-grid__item reveal"
              style={
                { gridArea: "c", "--reveal-i": 2 } as React.CSSProperties
              }
            >
              <LazyImage
                src={imageUrl(galleryImages[1])}
                alt=""
                loading="lazy"
                fill
              />
            </figure>
            <figure
              className="activity-grid__item reveal"
              style={
                { gridArea: "d", "--reveal-i": 3 } as React.CSSProperties
              }
            >
              <LazyImage
                src={imageUrl(galleryImages[2])}
                alt=""
                loading="lazy"
                fill
              />
            </figure>
            <Link
              href="/kaiinn"
              className="activity-grid__tile activity-grid__tile--gold reveal"
              style={
                { gridArea: "e", "--reveal-i": 4 } as React.CSSProperties
              }
            >
              <div className="activity-grid__tile-text">
                {ja(sidebar.memberRecruitment.label)}
                <span>{en(sidebar.memberRecruitment.label)}</span>
              </div>
            </Link>
            <figure
              className="activity-grid__item reveal"
              style={
                { gridArea: "f", "--reveal-i": 5 } as React.CSSProperties
              }
            >
              <LazyImage
                src={imageUrl(galleryImages[3])}
                alt=""
                loading="lazy"
                fill
              />
            </figure>
            <Link
              href="/aboutyia"
              className="activity-grid__tile activity-grid__tile--dark reveal"
              style={
                { gridArea: "g", "--reveal-i": 6 } as React.CSSProperties
              }
            >
              <div className="activity-grid__tile-text">
                YIAについて<span>About Us</span>
              </div>
            </Link>
            <figure
              className="activity-grid__item reveal"
              style={
                { gridArea: "h", "--reveal-i": 7 } as React.CSSProperties
              }
            >
              <LazyImage
                src={imageUrl(galleryImages[4])}
                alt=""
                loading="lazy"
                fill
              />
            </figure>
            <figure
              className="activity-grid__item reveal"
              style={
                { gridArea: "i", "--reveal-i": 8 } as React.CSSProperties
              }
            >
              <LazyImage
                src={imageUrl(galleryImages[5])}
                alt=""
                loading="lazy"
                fill
              />
            </figure>
          </div>
        </section>

        {/* Access map */}
        <section className="home-section home-section--tinted reveal">
          <h2 className="home-section__heading reveal">
            アクセス<small lang="en">Access</small>
          </h2>
          <div className="access-block reveal">
            <div className="access-block__map">
              <iframe
                src={stegaClean(data.site.googleMapsEmbedUrl)}
                width="100%"
                height="100%"
                style={{ border: 0, borderRadius: "6px" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="YIA Access Map"
              />
            </div>
            <div className="access-block__info">
              <p className="access-block__name">
                <span className="access-block__designation">{data.site.org.designation}</span>
                {ja(data.site.org.name)}
              </p>
              <div className="access-block__address">
                <p>
                  〒{data.site.contact.postalCode}{" "}
                  {ja(data.site.contact.address)}
                </p>
                <p className="access-block__address-en" lang="en">{en(data.site.contact.address)}</p>
              </div>
              <div className="access-block__hours">
                <p>{ja(data.site.businessHours)}</p>
                <p className="access-block__hours-en" lang="en">{en(data.site.businessHours)}</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter documents={sidebar.documents} />
    </HomepageEffects>
  );
}
