import Link from "next/link";
import { getSiteData } from "@/lib/data";
import { ja, en } from "@/lib/i18n";
import { imageUrl } from "@/lib/sanity/image";
import LazyImage from "@/components/LazyImage";
import CounterTile from "@/components/CounterTile";

export default async function HomepageActivityGrid() {
  const data = await getSiteData();
  const hp = data.homepage;

  const galleryImages = hp.activityGrid.images;
  const gridStat = hp.activityGrid.stat;

  return (
    <section className="activity-grid-wrap">
      <div className="activity-grid reveal-stagger">
        <figure
          className="activity-grid__item reveal"
          style={{ gridArea: "a", "--reveal-i": 0 } as React.CSSProperties}
        >
          <LazyImage src={imageUrl(galleryImages[0])} alt="" loading="lazy" fill />
        </figure>
        <CounterTile
          target={Number(gridStat.value)}
          label={ja(gridStat.label)}
          labelEn={en(gridStat.label)}
          className="activity-grid__tile activity-grid__tile--navy reveal"
          style={{ gridArea: "b", "--reveal-i": 1 } as React.CSSProperties}
        />
        <figure
          className="activity-grid__item reveal"
          style={{ gridArea: "c", "--reveal-i": 2 } as React.CSSProperties}
        >
          <LazyImage src={imageUrl(galleryImages[1])} alt="" loading="lazy" fill />
        </figure>
        <figure
          className="activity-grid__item reveal"
          style={{ gridArea: "d", "--reveal-i": 3 } as React.CSSProperties}
        >
          <LazyImage src={imageUrl(galleryImages[2])} alt="" loading="lazy" fill />
        </figure>
        <div
          className="activity-grid__tile activity-grid__tile--gold reveal"
          style={{ gridArea: "e", "--reveal-i": 4 } as React.CSSProperties}
        >
          <div className="activity-grid__tile-text">
            入会案内<span>Join Us</span>
          </div>
        </div>
        <figure
          className="activity-grid__item reveal"
          style={{ gridArea: "f", "--reveal-i": 5 } as React.CSSProperties}
        >
          <LazyImage src={imageUrl(galleryImages[3])} alt="" loading="lazy" fill />
        </figure>
        <Link
          href="/blog"
          className="activity-grid__tile activity-grid__tile--dark reveal"
          style={{ gridArea: "g", "--reveal-i": 6 } as React.CSSProperties}
        >
          <div className="activity-grid__tile-text">
            活動ブログ<span>Activity Blog</span>
          </div>
        </Link>
        <figure
          className="activity-grid__item reveal"
          style={{ gridArea: "h", "--reveal-i": 7 } as React.CSSProperties}
        >
          <LazyImage src={imageUrl(galleryImages[4])} alt="" loading="lazy" fill />
        </figure>
        <figure
          className="activity-grid__item reveal"
          style={{ gridArea: "i", "--reveal-i": 8 } as React.CSSProperties}
        >
          <LazyImage src={imageUrl(galleryImages[5])} alt="" loading="lazy" fill />
        </figure>
      </div>
    </section>
  );
}
