import { getSiteData } from "@/lib/data";

export default async function ContactBlock() {
  const { site } = await getSiteData();
  const { org, contact } = site;

  return (
    <section className="contact-block">
      <div className="contact-block__org">
        {org.designation} {org.nameJa}
      </div>
      <div className="contact-block__address">
        〒{contact.postalCode} {contact.addressJa}
      </div>
      <div className="contact-block__tel">
        TEL: {contact.tel} / FAX: {contact.fax}
      </div>
      <div className="contact-block__email">
        E-mail: <a href={`mailto:${contact.email}`}>{contact.email}</a>
      </div>
      <div className="contact-block__url">
        <a href={contact.website}>{contact.website}</a>
      </div>
    </section>
  );
}
