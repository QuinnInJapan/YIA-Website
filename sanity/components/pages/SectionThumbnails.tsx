import type { ReactElement } from "react";
import type { SectionTypeName } from "./types";

const S = { width: 120, height: 80 };
const c = "currentColor";

function Lines({ y, count, w = 80 }: { y: number; count: number; w?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <rect
          key={i}
          x={(S.width - w) / 2}
          y={y + i * 8}
          width={i === count - 1 ? w * 0.6 : w}
          height={3}
          rx={1.5}
          fill={c}
          opacity={0.25}
        />
      ))}
    </>
  );
}

function Grid({
  rows,
  cols,
  y,
  gap = 4,
  cellH = 12,
}: {
  rows: number;
  cols: number;
  y: number;
  gap?: number;
  cellH?: number;
}) {
  const totalW = 80;
  const cellW = (totalW - gap * (cols - 1)) / cols;
  const x0 = (S.width - totalW) / 2;
  return (
    <>
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, col) => (
          <rect
            key={`${r}-${col}`}
            x={x0 + col * (cellW + gap)}
            y={y + r * (cellH + gap)}
            width={cellW}
            height={cellH}
            rx={2}
            fill={c}
            opacity={0.2}
          />
        )),
      )}
    </>
  );
}

function TableRows({ y, rowCount = 3 }: { y: number; rowCount?: number }) {
  const x0 = (S.width - 80) / 2;
  return (
    <>
      {Array.from({ length: rowCount }, (_, i) => (
        <g key={i}>
          <rect x={x0} y={y + i * 14} width={24} height={8} rx={1} fill={c} opacity={0.3} />
          <rect x={x0 + 30} y={y + i * 14} width={50} height={8} rx={1} fill={c} opacity={0.15} />
        </g>
      ))}
    </>
  );
}

const thumbnails: Record<SectionTypeName, ReactElement> = {
  content: (
    <svg viewBox={`0 0 ${S.width} ${S.height}`}>
      <Lines y={16} count={5} />
    </svg>
  ),
  infoTable: (
    <svg viewBox={`0 0 ${S.width} ${S.height}`}>
      <TableRows y={14} rowCount={4} />
    </svg>
  ),
  links: (
    <svg viewBox={`0 0 ${S.width} ${S.height}`}>
      {Array.from({ length: 4 }, (_, i) => (
        <g key={i}>
          <circle cx={28} cy={20 + i * 15} r={3} fill={c} opacity={0.3} />
          <rect x={36} y={17.5 + i * 15} width={56} height={5} rx={1} fill={c} opacity={0.2} />
        </g>
      ))}
    </svg>
  ),
  warnings: (
    <svg viewBox={`0 0 ${S.width} ${S.height}`}>
      <rect x={20} y={18} width={80} height={44} rx={4} fill={c} opacity={0.1} />
      <text x={30} y={38} fontSize={14} fill={c} opacity={0.4}>
        !
      </text>
      <Lines y={28} count={3} w={50} />
    </svg>
  ),
  gallery: (
    <svg viewBox={`0 0 ${S.width} ${S.height}`}>
      <Grid rows={2} cols={3} y={16} cellH={24} />
    </svg>
  ),
  flyers: (
    <svg viewBox={`0 0 ${S.width} ${S.height}`}>
      <rect x={20} y={10} width={34} height={60} rx={3} fill={c} opacity={0.15} />
      <rect x={66} y={10} width={34} height={60} rx={3} fill={c} opacity={0.15} />
    </svg>
  ),
  eventSchedule: (
    <svg viewBox={`0 0 ${S.width} ${S.height}`}>
      <rect x={20} y={12} width={80} height={12} rx={2} fill={c} opacity={0.15} />
      <TableRows y={30} rowCount={3} />
    </svg>
  ),
  groupSchedule: (
    <svg viewBox={`0 0 ${S.width} ${S.height}`}>
      <Grid rows={3} cols={2} y={14} cellH={16} gap={6} />
    </svg>
  ),
  tableSchedule: (
    <svg viewBox={`0 0 ${S.width} ${S.height}`}>
      <Grid rows={4} cols={4} y={12} cellH={10} gap={3} />
    </svg>
  ),
  definitions: (
    <svg viewBox={`0 0 ${S.width} ${S.height}`}>
      {Array.from({ length: 3 }, (_, i) => (
        <g key={i}>
          <rect x={20} y={12 + i * 20} width={80} height={16} rx={3} fill={c} opacity={0.08} />
          <rect x={24} y={15 + i * 20} width={30} height={4} rx={1} fill={c} opacity={0.3} />
          <rect x={24} y={21 + i * 20} width={60} height={3} rx={1} fill={c} opacity={0.15} />
        </g>
      ))}
    </svg>
  ),
  feeTable: (
    <svg viewBox={`0 0 ${S.width} ${S.height}`}>
      <TableRows y={14} rowCount={4} />
    </svg>
  ),
  directoryList: (
    <svg viewBox={`0 0 ${S.width} ${S.height}`}>
      {Array.from({ length: 3 }, (_, i) => (
        <g key={i}>
          <circle cx={30} cy={22 + i * 20} r={6} fill={c} opacity={0.15} />
          <rect x={42} y={19 + i * 20} width={50} height={6} rx={1} fill={c} opacity={0.2} />
        </g>
      ))}
    </svg>
  ),
  boardMembers: (
    <svg viewBox={`0 0 ${S.width} ${S.height}`}>
      <Grid rows={2} cols={3} y={16} cellH={24} />
    </svg>
  ),
  fairTrade: (
    <svg viewBox={`0 0 ${S.width} ${S.height}`}>
      <circle cx={S.width / 2} cy={34} r={18} fill={c} opacity={0.12} />
      <Lines y={58} count={2} w={60} />
    </svg>
  ),
  sisterCities: (
    <svg viewBox={`0 0 ${S.width} ${S.height}`}>
      <rect x={14} y={14} width={38} height={52} rx={4} fill={c} opacity={0.12} />
      <rect x={68} y={14} width={38} height={52} rx={4} fill={c} opacity={0.12} />
    </svg>
  ),
  history: (
    <svg viewBox={`0 0 ${S.width} ${S.height}`}>
      <rect x={S.width / 2 - 1} y={10} width={2} height={60} fill={c} opacity={0.15} />
      {Array.from({ length: 4 }, (_, i) => (
        <circle key={i} cx={S.width / 2} cy={18 + i * 16} r={3} fill={c} opacity={0.3} />
      ))}
    </svg>
  ),
};

export function SectionThumbnail({ type }: { type: SectionTypeName }) {
  return (
    <div
      style={{
        width: "100%",
        aspectRatio: "3 / 2",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--card-fg-color)",
      }}
    >
      {thumbnails[type]}
    </div>
  );
}
