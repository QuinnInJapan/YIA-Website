import type { Metadata } from "next";
import { SolidHero } from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";
import AccessSection from "@/components/AccessSection";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "お問い合わせ",
};

export default function ContactPage() {
  return (
    <>
      <SolidHero titleJa="お問い合わせ" titleEn="Contact" />
      <main id="main">
        <ContactForm />
        <AccessSection />
      </main>
      <SiteFooter />
    </>
  );
}
