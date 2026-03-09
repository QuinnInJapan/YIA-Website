import { stegaClean } from "next-sanity";
import { getSiteData } from "@/lib/data";
import { ja, en } from "@/lib/i18n";
import LazyMap from "./LazyMap";

export default async function AccessSection() {
  const { site } = await getSiteData();

  return (
    <section id="access" className="home-section home-section--tinted">
      <h2 className="home-section__heading">
        アクセス<small lang="en">Access</small>
      </h2>
      <div className="access-block">
        <div className="access-block__map">
          <LazyMap src={stegaClean(site.googleMapsEmbedUrl)} />
        </div>
        <div className="access-block__info">
          <p className="access-block__name">
            <span className="access-block__designation">{site.org.designation}</span>
            {ja(site.org.name)}
          </p>
          <div className="access-block__address">
            <p>
              〒{site.contact.postalCode}{" "}
              {ja(site.contact.address)}
            </p>
            <p className="access-block__address-en" lang="en">{en(site.contact.address)}</p>
          </div>
          <div className="access-block__hours">
            <p>{ja(site.businessHours)}</p>
            <p className="access-block__hours-en" lang="en">{en(site.businessHours)}</p>
          </div>
          <div className="access-block__contact">
            <p>
              <a href={`tel:${stegaClean(site.contact.tel)}`}>TEL {site.contact.tel}</a>
            </p>
            <p>FAX {site.contact.fax}</p>
            <p>
              <a href={`mailto:${stegaClean(site.contact.email)}`}>{site.contact.email}</a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
