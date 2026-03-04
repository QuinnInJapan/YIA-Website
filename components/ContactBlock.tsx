import { stegaClean } from "next-sanity";
import { getSiteData } from "@/lib/data";
import { ja } from "@/lib/i18n";

export default async function ContactBlock() {
  const { site } = await getSiteData();
  const { org, contact } = site;

  return (
    <section className="contact-block">
      <div className="contact-block__org">
        {org.designation} {ja(org.name)}
      </div>
      <div className="contact-block__address">
        〒{contact.postalCode} {ja(contact.address)}
      </div>
      <div className="contact-block__tel">
        TEL: {contact.tel} / FAX: {contact.fax}
      </div>
      <div className="contact-block__email">
        E-mail: <a href={`mailto:${stegaClean(contact.email)}`}>{contact.email}</a>
      </div>
      <div className="contact-block__url">
        <a href={stegaClean(contact.website)}>{contact.website}</a>
      </div>
    </section>
  );
}
