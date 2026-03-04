import { getSiteData } from "@/lib/data";
import { ja } from "@/lib/i18n";
import { SolidHero } from "@/components/PageHero";
import PageLayout from "@/components/PageLayout";
import SectionHeader from "@/components/SectionHeader";

export default async function HandbookPageTemplate() {
  const { sidebar } = await getSiteData();

  const handbook = (sidebar.resourceBoxes || []).find(
    (rb) => rb.id === "nihongo-handbook"
  );

  const links = handbook?.links.filter((l) => l.url) ?? [];

  return (
    <PageLayout
      heroHtml={
        <SolidHero
          titleJa={ja(handbook?.title) || "日本語学習・生活"}
          titleEn="Japanese Study & Living Handbook"
        />
      }
      sectionHtml={
        <div className="handbook-page">
          <div className="page-section">
            <SectionHeader
              text="ハンドブックについて"
              textEn="About This Handbook"
              variant="plain"
              level={2}
            />
            <div className="handbook-page__about">
              <p>
                文化庁が発行する「日本語学習・生活ハンドブック」は、日本で生活する外国人の方が必要とする基本的な情報をまとめた資料です。日本語の学習方法、日常生活のルール、行政手続き、緊急時の対応など、幅広い内容が含まれています。
              </p>
              <p lang="en" className="handbook-page__about-en">
                The &ldquo;Japanese Study &amp; Living Handbook&rdquo; published
                by the Agency for Cultural Affairs provides essential information
                for foreign residents in Japan — covering Japanese language
                learning, daily life rules, administrative procedures, and
                emergency response.
              </p>
            </div>
          </div>

          <div className="page-section">
            <SectionHeader
              text="言語別ダウンロード"
              textEn="Download by Language"
              variant="plain"
              level={2}
            />
            <p className="handbook-page__download-note">
              各言語版をPDFでダウンロードできます（外部サイトが開きます）。
            </p>
            <ul className="handbook-page__list">
              {links.map((l, i) => (
                <li key={i} className="handbook-page__item">
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="handbook-page__link"
                  >
                    <span className="handbook-page__label">{l.label}</span>
                    {l.subtitle && (
                      <span className="handbook-page__subtitle">
                        {l.subtitle}
                      </span>
                    )}
                    <span className="handbook-page__icon" aria-hidden="true">
                      ↗
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="page-section">
            <SectionHeader
              text="出典"
              textEn="Source"
              variant="plain"
              level={2}
            />
            <p className="handbook-page__attribution">
              このハンドブックは{handbook?.attribution ?? "文化庁"}
              が作成・公開しているものです。
              <br />
              <span lang="en">
                This handbook is produced and published by the{" "}
                {handbook?.attribution ?? "文化庁"} (Agency for Cultural
                Affairs).
              </span>
            </p>
          </div>
        </div>
      }
      mainClass="layout-program"
    />
  );
}
