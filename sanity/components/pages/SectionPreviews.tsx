import type { ReactElement } from "react";
import type { SectionTypeName } from "./types";

// Shared inline-style constants matching globals.css
const navy = "#1e3a5f";
const grayLight = "#eef1f5";
const border = "#d0d8e0";
const textFaint = "#4a5565";
const accent = "#cc5533";
const secondary = "#855f07";
const white = "#fff";
const link = "#1e4a7a";

const base: React.CSSProperties = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: 14,
  lineHeight: 1.7,
  color: "#333",
  background: white,
  padding: "10px 14px",
};

// ── Mini Info-DL row ─────────────────────────────────────
function MiniInfoRow({
  label,
  labelEn,
  value,
}: {
  label: string;
  labelEn?: string;
  value: string;
}) {
  return (
    <div style={{ padding: "6px 0", borderBottom: `1px solid ${border}` }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: navy }}>
        {label}
        {labelEn && (
          <span
            style={{
              display: "block",
              fontSize: 10,
              fontWeight: 400,
              color: textFaint,
              marginTop: 1,
            }}
          >
            {labelEn}
          </span>
        )}
      </div>
      <div style={{ fontSize: 13, marginTop: 2 }}>{value}</div>
    </div>
  );
}

// ── Mini table header ────────────────────────────────────
function MiniTableHead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr>
        {cols.map((c) => (
          <th
            key={c}
            style={{
              background: navy,
              color: white,
              padding: "4px 8px",
              fontSize: 10,
              fontWeight: 600,
              textAlign: "left",
            }}
          >
            {c}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function MiniTableCell({ children, even }: { children: React.ReactNode; even?: boolean }) {
  return (
    <td
      style={{
        padding: "4px 8px",
        fontSize: 11,
        borderBottom: `1px solid ${border}`,
        background: even ? grayLight : "transparent",
      }}
    >
      {children}
    </td>
  );
}

// ── Previews ─────────────────────────────────────────────

const previews: Record<SectionTypeName, ReactElement> = {
  content: (
    <div style={base}>
      <p style={{ margin: "0 0 6px", fontSize: 13 }}>
        国際交流協会は、地域に住む外国人住民と日本人住民が共に暮らしやすいまちづくりを目指して活動しています。
      </p>
      <p style={{ margin: 0, fontSize: 10, color: textFaint }}>
        The International Association works to build a community where foreign and Japanese
        residents can live together comfortably.
      </p>
    </div>
  ),

  infoTable: (
    <div style={base}>
      <MiniInfoRow label="日時" labelEn="Date" value="毎月第2土曜日 10:00〜12:00" />
      <MiniInfoRow label="場所" labelEn="Location" value="市民交流センター 3階" />
      <MiniInfoRow label="対象" labelEn="Eligibility" value="市内在住の外国人" />
    </div>
  ),

  links: (
    <div style={base}>
      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {["申込書 / Application Form", "活動報告書 / Activity Report", "会則 / Bylaws"].map((d) => (
          <li
            key={d}
            style={{
              padding: "5px 0",
              borderBottom: `1px dotted ${border}`,
              fontSize: 12,
            }}
          >
            <span style={{ color: link }}>{d}</span>{" "}
            <span style={{ fontSize: 10, color: textFaint }}>(PDF)</span>
          </li>
        ))}
      </ul>
    </div>
  ),

  warnings: (
    <div style={base}>
      <div
        style={{
          borderLeft: `4px solid ${accent}`,
          background: "#fdf5f0",
          padding: "8px 10px",
        }}
      >
        <div style={{ fontSize: 12, color: accent, fontWeight: "bold" }}>
          参加には事前申し込みが必要です。定員になり次第締め切ります。
        </div>
        <div style={{ fontSize: 10, color: textFaint, marginTop: 4 }}>
          Pre-registration is required. Registration closes when capacity is reached.
        </div>
      </div>
    </div>
  ),

  gallery: (
    <div style={{ ...base, padding: "10px 14px 6px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            style={{
              aspectRatio: "4/3",
              borderRadius: 3,
              background: `hsl(${200 + i * 20}, ${30 + i * 5}%, ${70 - i * 5}%)`,
            }}
          />
        ))}
      </div>
    </div>
  ),

  flyers: (
    <div
      style={{
        ...base,
        display: "flex",
        gap: 8,
        justifyContent: "center",
      }}
    >
      {["#e8d5c0", "#c0d5e8"].map((bg, i) => (
        <div
          key={i}
          style={{
            width: 70,
            height: 96,
            borderRadius: 4,
            background: bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 9,
            color: navy,
            fontWeight: 600,
            textAlign: "center",
            lineHeight: 1.3,
            padding: 6,
          }}
        >
          {i === 0 ? "国際フェスティバル" : "日本語教室"}
        </div>
      ))}
    </div>
  ),

  eventSchedule: (
    <div style={base}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <MiniTableHead cols={["日付", "時間", "内容"]} />
        <tbody>
          {[
            ["4月12日", "10:00", "開会式"],
            ["5月10日", "13:00", "交流会"],
            ["6月14日", "10:00", "文化体験"],
          ].map(([d, t, desc], i) => (
            <tr key={i}>
              <MiniTableCell even={i % 2 === 1}>{d}</MiniTableCell>
              <MiniTableCell even={i % 2 === 1}>{t}</MiniTableCell>
              <MiniTableCell even={i % 2 === 1}>{desc}</MiniTableCell>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),

  groupSchedule: (
    <div style={base}>
      <div
        style={{
          background: grayLight,
          fontSize: 10,
          fontWeight: 700,
          color: navy,
          padding: "3px 8px",
          borderBottom: `2px solid ${border}`,
        }}
      >
        月曜日 Monday
      </div>
      {["日本語初級クラス", "英会話サークル"].map((name, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "5px 8px",
            borderBottom: `1px solid ${border}`,
            fontSize: 11,
          }}
        >
          <span style={{ fontWeight: 600 }}>{name}</span>
          <span style={{ fontSize: 10, color: textFaint }}>10:00〜12:00</span>
        </div>
      ))}
      <div
        style={{
          background: grayLight,
          fontSize: 10,
          fontWeight: 700,
          color: navy,
          padding: "3px 8px",
          borderBottom: `2px solid ${border}`,
          marginTop: 4,
        }}
      >
        水曜日 Wednesday
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "5px 8px",
          borderBottom: `1px solid ${border}`,
          fontSize: 11,
        }}
      >
        <span style={{ fontWeight: 600 }}>中国語講座</span>
        <span style={{ fontSize: 10, color: textFaint }}>14:00〜16:00</span>
      </div>
    </div>
  ),

  tableSchedule: (
    <div style={base}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <MiniTableHead cols={["時間", "月", "火", "水"]} />
        <tbody>
          {[
            ["10:00", "初級A", "中級", "初級B"],
            ["13:00", "会話", "—", "JLPT"],
            ["15:00", "—", "上級", "会話"],
          ].map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <MiniTableCell key={j} even={i % 2 === 1}>
                  {cell}
                </MiniTableCell>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),

  definitions: (
    <div style={base}>
      {[
        { term: "在留資格", termEn: "Residence Status", def: "日本に滞在するための法的な資格" },
        {
          term: "多文化共生",
          termEn: "Multicultural Coexistence",
          def: "異なる文化を持つ人々が共に暮らすこと",
        },
      ].map((d) => (
        <div
          key={d.term}
          style={{
            border: `1px solid ${border}`,
            borderRadius: 4,
            overflow: "hidden",
            marginBottom: 6,
          }}
        >
          <div
            style={{
              background: navy,
              color: white,
              padding: "4px 8px",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {d.term} <span style={{ fontWeight: 400, fontSize: 10, opacity: 0.8 }}>{d.termEn}</span>
          </div>
          <div style={{ padding: "6px 8px", fontSize: 11 }}>{d.def}</div>
        </div>
      ))}
    </div>
  ),

  feeTable: (
    <div style={base}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <MiniTableHead cols={["会員種別", "年会費"]} />
        <tbody>
          {[
            ["個人会員", "3,000円"],
            ["家族会員", "5,000円"],
            ["団体会員", "10,000円"],
          ].map(([type, fee], i) => (
            <tr key={i}>
              <MiniTableCell even={i % 2 === 1}>{type}</MiniTableCell>
              <MiniTableCell even={i % 2 === 1}>{fee}</MiniTableCell>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),

  directoryList: (
    <div style={base}>
      {[
        { name: "市民交流センター", tel: "0123-45-6789" },
        { name: "国際交流協会", tel: "0123-45-0000" },
        { name: "多文化共生センター", tel: "0123-45-1111" },
      ].map((e) => (
        <div
          key={e.name}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "5px 8px",
            borderBottom: `1px solid ${border}`,
            fontSize: 11,
          }}
        >
          <span>{e.name}</span>
          <span style={{ fontSize: 10, color: textFaint }}>{e.tel}</span>
        </div>
      ))}
    </div>
  ),

  boardMembers: (
    <div style={base}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 6,
        }}
      >
        {[
          { role: "会長", name: "山田太郎" },
          { role: "副会長", name: "佐藤花子" },
          { role: "理事", name: "田中一郎" },
          { role: "監事", name: "鈴木次郎" },
        ].map((m) => (
          <div
            key={m.name}
            style={{
              padding: "5px 8px",
              background: grayLight,
              borderLeft: `3px solid ${secondary}`,
            }}
          >
            <div
              style={{
                fontSize: 9,
                color: textFaint,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {m.role}
            </div>
            <div style={{ fontSize: 12, fontWeight: 500 }}>{m.name}</div>
          </div>
        ))}
      </div>
    </div>
  ),

  fairTrade: (
    <div style={base}>
      <p style={{ margin: "0 0 8px", fontSize: 12 }}>
        フェアトレード商品を販売しています。途上国の生産者を支援する取り組みです。
      </p>
      <div style={{ borderBottom: `1px solid ${border}`, padding: "4px 0" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: navy }}>コーヒー</span>
        <span style={{ fontSize: 11, marginLeft: 12 }}>200g — ¥800</span>
      </div>
      <div style={{ borderBottom: `1px solid ${border}`, padding: "4px 0" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: navy }}>紅茶</span>
        <span style={{ fontSize: 11, marginLeft: 12 }}>100g — ¥600</span>
      </div>
    </div>
  ),

  sisterCities: (
    <div style={{ ...base, padding: 0 }}>
      <div style={{ display: "flex" }}>
        <div
          style={{
            flex: 3,
            background: `linear-gradient(135deg, #6b8cae, #3d6a8f)`,
            minHeight: 80,
          }}
        />
        <div
          style={{
            flex: 2,
            background: navy,
            color: white,
            padding: "10px 10px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 8,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              opacity: 0.7,
            }}
          >
            USA
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>Springfield</div>
          <div style={{ fontSize: 10, opacity: 0.8, marginTop: 1 }}>スプリングフィールド市</div>
        </div>
      </div>
    </div>
  ),

  history: (
    <div style={base}>
      {[
        { year: "1990", text: "国際交流協会設立" },
        { year: "1995", text: "姉妹都市提携締結" },
        { year: "2005", text: "多文化共生センター開設" },
      ].map((e) => (
        <div
          key={e.year}
          style={{
            padding: "5px 0",
            borderBottom: `1px solid ${border}`,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 12 }}>{e.year}</div>
          <div style={{ fontSize: 11, color: textFaint }}>{e.text}</div>
        </div>
      ))}
    </div>
  ),
};

// ── Scaled preview container ─────────────────────────────
// Renders the full-size HTML then scales it down to fit the
// card thumbnail area. The inner div is rendered at a fixed
// width and scaled to fill the container using container
// query units (the parent card sets containerType).

const PREVIEW_W = 300;
const DISPLAY_H = 140;
const SCALE = 0.75;

export function SectionPreview({ type }: { type: SectionTypeName }) {
  return (
    <div
      style={{
        width: "100%",
        height: DISPLAY_H,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          width: PREVIEW_W,
          transformOrigin: "top left",
          transform: `scale(${SCALE})`,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {previews[type]}
      </div>
    </div>
  );
}
