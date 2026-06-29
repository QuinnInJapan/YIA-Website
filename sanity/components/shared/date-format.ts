export function formatStudioDateOnly(dateStr: string | null): string {
  if (!dateStr) return "下書き";
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("ja-JP");
}

export function formatStudioDateTime(dateStr: string | null): string {
  if (!dateStr) return "下書き";
  return new Date(dateStr).toLocaleDateString("ja-JP");
}

export function formatStudioRelativeTime(
  dateStr: string | undefined | null,
  now = Date.now(),
): string {
  if (!dateStr) return "";
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "たった今";
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}日前`;
  return new Date(dateStr).toLocaleDateString("ja-JP");
}
