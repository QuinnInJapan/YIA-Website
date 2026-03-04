import { getSiteData } from "@/lib/data";
import { SolidHero } from "@/components/PageHero";
import PageLayout from "@/components/PageLayout";
import SidebarToc from "@/components/SidebarToc";
import SectionHeader from "@/components/SectionHeader";
import BilingualBlock from "@/components/BilingualBlock";
import InfoTable from "@/components/InfoTable";
import ScheduleTable from "@/components/ScheduleTable";
import BoardMembers from "@/components/BoardMembers";
import { tocId } from "@/lib/helpers";
import type { TocEntry } from "@/lib/section-renderer";

export default async function AboutPageTemplate() {
  const { aboutPage: pg } = await getSiteData();
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

  // Mission
  addSection(
    "私たちの理念",
    "Our Mission",
    <BilingualBlock ja={pg.missionJa} en={pg.missionEn || ""} />
  );

  // Org overview
  const od = pg.orgDetails;
  addSection(
    "団体概要",
    "Organization Overview",
    <InfoTable
      rows={[
        { labelJa: "設立", labelEn: "Founded", valueJa: od.founded },
        {
          labelJa: "NPO認定",
          labelEn: "NPO Established",
          valueJa: od.npoEstablished,
        },
        {
          labelJa: "会員数",
          labelEn: "Members",
          valueJa: od.members,
          valueEn: od.membersEn,
        },
        {
          labelJa: "職員",
          labelEn: "Staff",
          valueJa: od.staff || "",
          valueEn: od.staffEn,
        },
      ]}
    />
  );

  // Business activities
  if (pg.businessActivities) {
    const ba = pg.businessActivities;
    const categories = [
      { key: "support" as const, labelJa: "支援事業", labelEn: "Support Services" },
      { key: "educational" as const, labelJa: "啓発事業", labelEn: "Educational Programs" },
      { key: "exchange" as const, labelJa: "交流事業", labelEn: "Cultural Exchange" },
      { key: "contribution" as const, labelJa: "国際貢献", labelEn: "International Contribution" },
      { key: "other" as const, labelJa: "その他", labelEn: "Other" },
    ];
    const rows = categories
      .filter((cat) => ba[cat.key]?.length)
      .map((cat) => ({
        labelJa: cat.labelJa,
        labelEn: cat.labelEn,
        valueJa: ba[cat.key]!.join("、"),
      }));
    addSection("事業内容", "Activities", <InfoTable rows={rows} />);
  }

  // History
  if (pg.history?.length) {
    const histRows = pg.history.map((h) => [h.year, h.eventJa]);
    addSection(
      "あゆみ",
      "Our History",
      <ScheduleTable
        columns={["年", "出来事"]}
        columnsEn={["Year", "Event"]}
        rows={histRows}
      />
    );
  }

  // Board members
  if (pg.boardMembers) {
    addSection(
      "役員一覧",
      "Board Members",
      <BoardMembers board={pg.boardMembers} />
    );
  }

  // Governance
  if (pg.governance) {
    const jaLines = pg.governance.ja.split("\n").map((l: string) => l.trim()).filter(Boolean);
    const enLines = pg.governance.en.split("\n").map((l: string) => l.trim()).filter(Boolean);
    const govItems = jaLines.map((line: string, i: number) => {
      const [termJa, ...descJaParts] = line.split("：");
      const enLine = enLines[i] || "";
      const [termEn, ...descEnParts] = enLine.split(": ");
      return {
        termJa: termJa.trim(),
        termEn: termEn.trim(),
        descJa: descJaParts.join("：").trim(),
        descEn: descEnParts.join(": ").trim(),
      };
    });
    addSection(
      "運営",
      "Governance",
      <dl className="governance-list">
        {govItems.map((item: { termJa: string; termEn: string; descJa: string; descEn: string }, i: number) => (
          <div className="governance-list__item" key={i}>
            <dt>
              {item.termJa}
              <span className="governance-list__term-en" lang="en">{item.termEn}</span>
            </dt>
            <dd>
              {item.descJa}
              <span className="governance-list__desc-en" lang="en">{item.descEn}</span>
            </dd>
          </div>
        ))}
      </dl>
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
