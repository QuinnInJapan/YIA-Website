import type { InfoTableSection } from "@/lib/types";
import type { SectionHandler } from "./types";
import { ja, en } from "@/lib/i18n";
import InfoTable from "@/components/InfoTable";
import BilingualBlock from "@/components/BilingualBlock";

export const infoTable: SectionHandler<InfoTableSection> = (s, ctx) => {
  if (!s.rows) {
    ctx.flush();
    return;
  }
  ctx.addTocHeader(ja(s.title), en(s.title));
  const infoRows = s.rows.map((row) => {
    if (s.appointmentNote && ja(row.label) === "予約") {
      return {
        ...row,
        value: [
          { _key: "ja", value: `${ja(row.value)}\n${ja(s.appointmentNote)}` },
          { _key: "en", value: `${en(row.value)}\n${en(s.appointmentNote)}` },
        ],
      };
    }
    if (s.additionalLanguageNote && ja(row.label) === "対応言語") {
      return {
        ...row,
        value: [
          { _key: "ja", value: `${ja(row.value)}\n${ja(s.additionalLanguageNote)}` },
          { _key: "en", value: `${en(row.value)}\n${en(s.additionalLanguageNote)}` },
        ],
      };
    }
    return row;
  });
  ctx.push(<InfoTable rows={infoRows} />);
  if (s.otherNotes) {
    ctx.push(<BilingualBlock ja={ja(s.otherNotes)} en={en(s.otherNotes)} />);
  }
  ctx.flush();
};
