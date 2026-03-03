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

export default function HomepageTemplate() {
  const data = getSiteData();
  const hp = data.homepage;
  const nav = getEnrichedNavigation();
  const sidebar = data.globalResources;
  const heroImage = resolveImage(hp.hero.image);

  // Inline announcements list
  const hpAnnouncements = getAnnouncementsByIds(hp.announcementIds);

  // Activity mosaic
  const galleryImages = hp.activityGrid.images;
  const gridStat = hp.activityGrid.stat;

  return (
    <HomepageEffects>
      <section
        className="hero-viewport"
        style={{ backgroundImage: `url('${heroImage}')` }}
      >
        <div className="hero__overlay">
          <h1 className="hero__title">{data.site.org.nameJa}</h1>
          <p className="hero__subtitle">{data.site.org.nameEn}</p>
          <p className="hero__tagline">{hp.hero.taglineJa}</p>
          <p className="hero__tagline-en">{hp.hero.taglineEn}</p>
        </div>
      </section>

      <main id="main">
        {/* Announcements band */}
        <section className="oshirase-band reveal">
          <div className="oshirase-inner">
            <h2 className="home-section__heading reveal">
              お知らせ<small>Announcements</small>
            </h2>
            <div className="oshirase-list reveal-stagger">
              {hpAnnouncements.map((a, i) => {
                const d = a.date || "";
                const dateDisplay = d ? d.replace(/-/g, ".") : "";
                return (
                  <a
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
                      <span className="oshirase-title__en">{a.titleEn}</span>
                    </span>
                  </a>
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
              <a href="/announcements" className="oshirase-viewall">
                すべてのお知らせを見る / View All →
              </a>
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
                />
                <div className="program-card__overlay">
                  <h3 className="program-card__title">{cat.labelJa}</h3>
                  <span className="program-card__title-en">
                    {cat.labelEn}
                  </span>
                  <div className="program-card__links">
                    {cat.items.map((it) => (
                      <a
                        href={it.url}
                        className="program-card__link"
                        key={it.id}
                      >
                        {it.titleJa}
                        <span className="program-card__link-en">
                          {it.titleEn}
                        </span>
                      </a>
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
            style={{ backgroundImage: `url('${heroImage}')` }}
          >
            <h2 className="home-section__heading reveal">
              イベント<small>Upcoming Events</small>
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
              />
            </figure>
            <a
              href={sidebar.memberRecruitment.url}
              className="activity-grid__tile activity-grid__tile--gold reveal"
              style={
                { gridArea: "e", "--reveal-i": 4 } as React.CSSProperties
              }
            >
              <div className="activity-grid__tile-text">
                {sidebar.memberRecruitment.labelJa}
                <span>{sidebar.memberRecruitment.labelEn}</span>
              </div>
            </a>
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
              />
            </figure>
            <a
              href="/aboutyia"
              className="activity-grid__tile activity-grid__tile--dark reveal"
              style={
                { gridArea: "g", "--reveal-i": 6 } as React.CSSProperties
              }
            >
              <div className="activity-grid__tile-text">
                YIAについて<span>About Us</span>
              </div>
            </a>
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
              />
            </figure>
          </div>
        </section>

        {/* Access map */}
        <section className="home-section home-section--tinted reveal">
          <h2 className="home-section__heading reveal">
            アクセス<small>Access</small>
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
                {data.site.org.designation} {data.site.org.nameJa}
              </p>
              <p>
                〒{data.site.contact.postalCode}{" "}
                {data.site.contact.addressJa}
              </p>
              <p>{data.site.contact.addressEn}</p>
              <p>
                TEL: {data.site.contact.tel} / FAX: {data.site.contact.fax}
              </p>
              <p>
                E-mail:{" "}
                <a href={`mailto:${data.site.contact.email}`}>
                  {data.site.contact.email}
                </a>
              </p>
              <p>{data.site.businessHours.ja}</p>
              <p>{data.site.businessHours.en}</p>
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
