import { dayToDate, LOCALE } from "@/lib/dates";
import type { DayRange } from "@/types/plan";

const short = (key: string, withYear: boolean) =>
  dayToDate(key).toLocaleDateString(LOCALE, { day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}) });

/** "1 Kas – 15 Ara 2026"; the year shows once when both ends share it, on both ends otherwise. */
export function formatRange({ start, end }: DayRange): string {
  if (start === end) return short(start, true);
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  return `${short(start, !sameYear)} – ${short(end, true)}`;
}
