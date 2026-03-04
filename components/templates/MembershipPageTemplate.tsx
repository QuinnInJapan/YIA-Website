import { getSiteData } from "@/lib/data";
import { SolidHero } from "@/components/PageHero";
import PageLayout from "@/components/PageLayout";
import SidebarToc from "@/components/SidebarToc";
import SectionHeader from "@/components/SectionHeader";
import FeeTable from "@/components/FeeTable";
import InfoTable from "@/components/InfoTable";
import BilingualBlock from "@/components/BilingualBlock";
import DocList from "@/components/DocList";
import { tocId } from "@/lib/helpers";
import type { TocEntry } from "@/lib/section-renderer";

export default async function MembershipPageTemplate() {
  const { membershipPage: pg } = await getSiteData();
  const tocEntries: TocEntry[] = [];
  const sections: React.ReactNode[] = [];

  function addSection(
    titleJa: string,
    titleEn: string,
    content: React.ReactNode
  ) {
    const id = tocId(titleJa);
    tocEntries.push({ id, textJa: titleJa, textEn: titleEn });
    sections.push(
      <div className="page-section" key={id}>
        <SectionHeader
          text={titleJa}
          textEn={titleEn}
          variant="plain"
          level={2}
          id={id}
        />
        {content}
      </div>
    );
  }

  // Fee table
  addSection(
    "年会費のご案内",
    "Membership Fees",
    <FeeTable rows={pg.feeTable} />
  );

  // Member types
  if (pg.memberTypes?.length) {
    addSection(
      "会員種別",
      "Member Types",
      <InfoTable
        rows={pg.memberTypes.map((mt) => ({
          labelJa: mt.typeJa,
          valueJa: mt.descriptionJa,
        }))}
      />
    );
  }

  // Benefits
  if (pg.benefits) {
    addSection(
      "会員になると",
      "Member Benefits",
      <BilingualBlock ja={pg.benefits.ja} en={pg.benefits.en} />
    );
  }

  // How to join
  {
    const joinContent = (
      <>
        {pg.registrationProcess && (
          <BilingualBlock ja={pg.registrationProcess} en="" />
        )}
        {pg.registrationForms?.length && (
          <DocList docs={pg.registrationForms} />
        )}
        {pg.bankTransfer && (
          <>
            <SectionHeader
              text="振込先"
              textEn="Bank Transfer"
              variant="plain"
              level={3}
            />
            <InfoTable
              rows={[
                {
                  labelJa: "銀行",
                  labelEn: "Bank",
                  valueJa: pg.bankTransfer.bank,
                  valueEn: pg.bankTransfer.bankEn,
                },
                {
                  labelJa: "口座番号",
                  labelEn: "Account",
                  valueJa: pg.bankTransfer.accountNumber,
                },
                {
                  labelJa: "口座名義",
                  labelEn: "Holder",
                  valueJa: pg.bankTransfer.accountHolder,
                },
              ]}
            />
          </>
        )}
      </>
    );
    addSection("入会のお申込み", "How to Join", joinContent);
  }

  // Privacy notice
  if (pg.privacyNotice) {
    sections.push(
      <div className="page-section" key="privacy">
        <BilingualBlock
          ja={pg.privacyNotice.ja}
          en={pg.privacyNotice.en}
        />
      </div>
    );
  }

  return (
    <PageLayout
      heroHtml={<SolidHero titleJa={pg.titleJa} titleEn={pg.titleEn} />}
      tocHtml={<SidebarToc entries={tocEntries} />}
      sectionHtml={<>{sections}</>}
    />
  );
}
