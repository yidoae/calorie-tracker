import type { WeightEntry } from "@/types/tracking";
import { dayToDate } from "../dates";

/*
 * Weight trend: daily weigh-ins swing by a kilo or more with water and salt, so progress is read
 * from a trailing average and a fitted weekly rate rather than from the last number.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
/** Days averaged into each trend point. */
export const TREND_WINDOW_DAYS = 7;
/** Days of history used for the weekly rate. */
const RATE_WINDOW_DAYS = 28;
const MIN_POINTS_FOR_RATE = 3;

export interface TrendPoint {
  day: string;
  kg: number;
  /** Mean of the weigh-ins in the trailing window ending on this day. */
  trend: number;
}

/** Entries sorted oldest first, each with its trailing average. */
export function weightTrend(entries: readonly WeightEntry[]): TrendPoint[] {
  const sorted = [...entries].sort((a, b) => a.day.localeCompare(b.day));
  return sorted.map((entry, i) => {
    const end = dayToDate(entry.day).getTime();
    const window = sorted.slice(0, i + 1).filter((e) => end - dayToDate(e.day).getTime() < TREND_WINDOW_DAYS * DAY_MS);
    const trend = window.reduce((sum, e) => sum + e.kg, 0) / window.length;
    return { day: entry.day, kg: entry.kg, trend: Math.round(trend * 10) / 10 };
  });
}

/** Least-squares slope of the last 4 weeks of weigh-ins, kg per week; null with too little data. */
export function weeklyRate(entries: readonly WeightEntry[]): number | null {
  if (entries.length === 0) return null;
  const sorted = [...entries].sort((a, b) => a.day.localeCompare(b.day));
  const last = dayToDate(sorted[sorted.length - 1].day).getTime();
  const recent = sorted.filter((e) => last - dayToDate(e.day).getTime() <= RATE_WINDOW_DAYS * DAY_MS);
  if (recent.length < MIN_POINTS_FOR_RATE) return null;
  const xs = recent.map((e) => (dayToDate(e.day).getTime() - last) / (7 * DAY_MS));
  const ys = recent.map((e) => e.kg);
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const my = ys.reduce((a, b) => a + b, 0) / ys.length;
  const sxx = xs.reduce((sum, x) => sum + (x - mx) ** 2, 0);
  if (sxx === 0) return null;
  const slope = xs.reduce((sum, x, i) => sum + (x - mx) * (ys[i] - my), 0) / sxx;
  return Math.round(slope * 100) / 100;
}

/** Weeks until the trend reaches `target` at `ratePerWeek`, or null if it's moving the other way. */
export function weeksToTarget(current: number, target: number, ratePerWeek: number | null): number | null {
  const diff = target - current;
  if (Math.abs(diff) < 0.1) return 0;
  if (ratePerWeek === null || Math.abs(ratePerWeek) < 0.05) return null;
  if (Math.sign(diff) !== Math.sign(ratePerWeek)) return null;
  return Math.ceil(diff / ratePerWeek);
}
