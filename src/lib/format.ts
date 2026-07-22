export function formatYen(value: number): string {
  return `¥${Math.round(value).toLocaleString("ja-JP")}`;
}

export function formatYenCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 100_000_000) return `${(value / 100_000_000).toFixed(2)}億円`;
  if (abs >= 10_000) return `${(value / 10_000).toFixed(0)}万円`;
  return `${Math.round(value).toLocaleString("ja-JP")}円`;
}

export function formatYearMonth(yyyyMm: string): string {
  const [y, m] = yyyyMm.split("-");
  return `${y}年${Number(m)}月`;
}
