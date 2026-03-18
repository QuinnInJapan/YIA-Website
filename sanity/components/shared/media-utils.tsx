// Shared media utilities used by MediaBrowser and FilePickerPanel

// ── File type visuals ────────────────────────────────────

export interface FileTypeStyle {
  label: string;
  color: string;
  bgColor: string;
}

export function getFileType(mimeType: string | null, ext?: string | null): FileTypeStyle {
  if (!mimeType && !ext) return { label: "FILE", color: "#6b7a8d", bgColor: "#f0f2f5" };

  if (mimeType === "application/pdf") return { label: "PDF", color: "#d93025", bgColor: "#fce8e6" };

  if (
    mimeType === "application/vnd.ms-excel" ||
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  )
    return { label: "Excel", color: "#188038", bgColor: "#e6f4ea" };

  if (mimeType === "text/csv") return { label: "CSV", color: "#188038", bgColor: "#e6f4ea" };

  if (
    mimeType === "application/msword" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return { label: "Word", color: "#1a73e8", bgColor: "#e8f0fe" };

  if (
    mimeType === "application/vnd.ms-powerpoint" ||
    mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  )
    return { label: "PPT", color: "#e65100", bgColor: "#fff3e0" };

  if (mimeType?.includes("zip") || mimeType?.includes("compressed"))
    return { label: "ZIP", color: "#6a1b9a", bgColor: "#f3e5f5" };

  const label = ext?.toUpperCase() || mimeType?.split("/")[1]?.toUpperCase() || "FILE";
  return { label, color: "#6b7a8d", bgColor: "#f0f2f5" };
}

// ── File type icon ───────────────────────────────────────

export function FileTypeIcon({
  mimeType,
  ext,
  size = 32,
}: {
  mimeType: string | null;
  ext?: string | null;
  size?: number;
}) {
  const ft = getFileType(mimeType, ext);
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <path d="M8 4 H26 L32 10 V36 H8 Z" fill="white" stroke={ft.color} strokeWidth="1.5" />
      <path d="M26 4 V10 H32" fill={ft.bgColor} stroke={ft.color} strokeWidth="1.5" />
      <rect x="10" y="19" width="20" height="12" rx="2" fill={ft.color} />
      <text
        x="20"
        y="28"
        textAnchor="middle"
        fill="white"
        fontSize={ft.label.length > 4 ? "6" : "7.5"}
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        {ft.label}
      </text>
    </svg>
  );
}

// ── Format file size ─────────────────────────────────────

export function formatFileSize(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
