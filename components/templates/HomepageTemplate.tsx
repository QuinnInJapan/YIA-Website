import Image from "next/image";
import Link from "next/link";
import {
  getSiteData,
  getEnrichedNavigation,
  getAnnouncementsByIds,
} from "@/lib/data";
import { resolveImage } from "@/lib/images";
import SiteFooter from "@/components/SiteFooter";
import EventFlyerPairWrapper from "@/components/EventFlyerPairWrapper";
import HomepageEffects from "@/components/HomepageEffects";
import LazyImage from "@/components/LazyImage";

export default async function HomepageTemplate() {
  const data = await getSiteData();
  const hp = data.homepage;
  const nav = await getEnrichedNavigation();
  const sidebar = data.globalResources;
  const heroImage = resolveImage(hp.hero.image);

  // Inline announcements list
  const hpAnnouncements = await getAnnouncementsByIds(hp.announcementIds);

  // Activity mosaic
  const galleryImages = hp.activityGrid.images;
  const gridStat = hp.activityGrid.stat;

  return (
    <HomepageEffects>
      <section className="hero-viewport">
        <Image
          src={heroImage}
          alt=""
          fill
          priority
          sizes="100vw"
          className="hero-viewport__img"
        />
        <div className="hero__overlay">
          <h1 className="hero__title">{data.site.org.nameJa}</h1>
          <p className="hero__subtitle">{data.site.org.nameEn}</p>
          <p className="hero__tagline">{hp.hero.taglineJa}</p>
          <p className="hero__tagline-en" lang="en">{hp.hero.taglineEn}</p>
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
                const dateDisplay = d ? d.replace(/-/g, ".") : "";
                return (
                  <Link
                    href={`/announcements#${a.id}`}
                    className="oshirase-item reveal"
                    style={{ "--reveal-i": i } as React.CSSProperties}
                    key={a.id}
                  >
                    <time className="oshirase-date" dateTime={d}>
                      {dateDisplay}
                    </time>
                    <span className="oshirase-title">
                      <span className="oshirase-title__ja">{a.titleJa}</span>
                      <span className="oshirase-title__en" lang="en">{a.titleEn}</span>
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
          {nav.categories.map((cat, i) => {
            const img = cat.heroImage ? resolveImage(cat.heroImage) : "";
            return (
              <div
                className="program-card reveal"
                style={{ "--reveal-i": i } as React.CSSProperties}
                key={cat.id}
              >
                <LazyImage
                  src={img}
                  alt=""
                  className="program-card__img"
                  fill
                />
                <div className="program-card__overlay">
                  <h3 className="program-card__title">{cat.labelJa}</h3>
                  <span className="program-card__title-en" lang="en">
                    {cat.labelEn}
                  </span>
                  <div className="program-card__links">
                    {cat.items.map((it) => (
                      <Link
                        href={it.url}
                        className="program-card__link"
                        key={it.id}
                      >
                        {it.titleJa}
                        <span className="program-card__link-en" lang="en">
                          {it.titleEn}
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
            <Image
              src={heroImage}
              alt=""
              fill
              sizes="100vw"
              className="home-section--events__bg"
            />
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
                src={resolveImage(galleryImages[0])}
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
                {gridStat.labelJa}
                <span>{gridStat.labelEn}</span>
              </div>
            </div>
            <figure
              className="activity-grid__item reveal"
              style={
                { gridArea: "c", "--reveal-i": 2 } as React.CSSProperties
              }
            >
              <LazyImage
                src={resolveImage(galleryImages[1])}
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
                src={resolveImage(galleryImages[2])}
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
                {sidebar.memberRecruitment.labelJa}
                <span>{sidebar.memberRecruitment.labelEn}</span>
              </div>
            </Link>
            <figure
              className="activity-grid__item reveal"
              style={
                { gridArea: "f", "--reveal-i": 5 } as React.CSSProperties
              }
            >
              <LazyImage
                src={resolveImage(galleryImages[3])}
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
                src={resolveImage(galleryImages[4])}
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
                src={resolveImage(galleryImages[5])}
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
                src={data.site.googleMapsEmbedUrl}
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
                {data.site.org.nameJa}
              </p>
              <div className="access-block__address">
                <p>
                  〒{data.site.contact.postalCode}{" "}
                  {data.site.contact.addressJa}
                </p>
                <p className="access-block__address-en" lang="en">{data.site.contact.addressEn}</p>
              </div>
              <div className="access-block__contact">
                <p>TEL: <a href={`tel:${data.site.contact.tel.replace(/-/g, "")}`}>{data.site.contact.tel}</a></p>
                <p>FAX: {data.site.contact.fax}</p>
                <p>
                  E-mail:{" "}
                  <a href={`mailto:${data.site.contact.email}`}>
                    {data.site.contact.email}
                  </a>
                </p>
              </div>
              <div className="access-block__hours">
                <p>{data.site.businessHours.ja}</p>
                <p className="access-block__hours-en" lang="en">{data.site.businessHours.en}</p>
              </div>
              {sidebar.youtubeLink && (
                <p className="access-block__youtube">
                  <a
                    href={sidebar.youtubeLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${sidebar.youtubeLink.labelJa} (opens in new tab)`}
                    className="external-link"
                  >
                    <span className="access-block__youtube-ja">▶ {sidebar.youtubeLink.labelJa}</span>
                    <span className="access-block__youtube-en" lang="en">{sidebar.youtubeLink.labelEn}</span>
                  </a>
                </p>
              )}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter
        documents={sidebar.documents}
        hideContact={true}
      />
    </HomepageEffects>
  );
}
