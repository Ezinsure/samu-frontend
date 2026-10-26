const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** `"09"` (or `"2026-09"`) → `"Sep"`. Unknown input is returned unchanged. */
export function monthLabel(month: string): string {
  const number = Number(month.slice(-2));
  return MONTH_NAMES[number - 1] ?? month;
}

/** Applies `monthLabel` to the `month` field of chart rows. */
export function withMonthLabels<T extends { month: string }>(rows: T[]): T[] {
  return rows.map((row) => ({ ...row, month: monthLabel(row.month) }));
}
