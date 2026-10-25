import { addMonths, dayKey, dayToDate, monthGrid, startOfMonth } from "@calorie/core/dates";
import { MONTH_NAMES, WEEKDAY_NAMES } from "@calorie/core/labels";
import { rateDay, type DayRating } from "@calorie/core/nutrition/dayRating";
import { resolveTargets, type ResolvedTargets } from "@calorie/core/nutrition/targets";
import type { NutritionPlan } from "@calorie/core/schemas/plan";
import type { MealKcal } from "@calorie/core/schemas/rows";
import { localDayKey } from "./mealLogic";

/*
 * Pure logic behind the calendar and a past day (US5, FR-019). Days are `YYYY-MM-DD` strings
 * (meals.local_date), so nothing here depends on the device's time zone except the day a plan was
 * saved on. No React Native imports, so tests/historyLogic.test.ts runs this under node.
 */

/** The calories eaten on each day: the sum of its meals' server-computed totals. */
export function kcalByDay(rows: readonly MealKcal[]): Map<string, number> {
  const sums = new Map<string, number>();
  for (const row of rows) sums.set(row.localDate, (sums.get(row.localDate) ?? 0) + row.calories);
  return sums;
}

/**
 * The plan a past day is judged against: the last one saved by the end of that local day, so today
 * matches the dashboard's active plan. Days before the first plan use the first plan (setup saves
 * it before any meal can be logged); null only when there are no plans at all.
 */
export function planOnDay(plans: readonly NutritionPlan[], localDate: string, timeZone: string): NutritionPlan | null {
  const sorted = [...plans].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const saved = sorted.filter((p) => localDayKey(new Date(p.createdAt), timeZone) <= localDate);
  return saved.at(-1) ?? sorted[0] ?? null;
}

/** The targets in effect on a day: that day's plan, its training or rest day when it cycles. */
export function dayTargets(plans: readonly NutritionPlan[], localDate: string, timeZone: string): ResolvedTargets {
  return resolveTargets(planOnDay(plans, localDate, timeZone), dayToDate(localDate));
}

export interface CalendarDay {
  localDate: string;
  day: number;
  /** Null when nothing was logged: such days show no mark (FR-019). */
  rating: DayRating | null;
  isToday: boolean;
  /** After today: shown greyed, cannot be opened. */
  isFuture: boolean;
}

/** The month's Monday-first grid (null pads), each logged day rated against its own calorie target. */
export function calendarDays(
  month: Date,
  rows: readonly MealKcal[],
  plans: readonly NutritionPlan[],
  today: string,
  timeZone: string,
): (CalendarDay | null)[] {
  const eaten = kcalByDay(rows);
  return monthGrid(month).map((date) => {
    if (!date) return null;
    const localDate = dayKey(date);
    const kcal = eaten.get(localDate);
    return {
      localDate,
      day: date.getDate(),
      rating: kcal === undefined ? null : rateDay(kcal, dayTargets(plans, localDate, timeZone).targets.calories),
      isToday: localDate === today,
      isFuture: localDate > today,
    };
  });
}

/** Months after the current one hold no meals, so the calendar stops there. */
export function canGoForward(month: Date, today: string): boolean {
  return addMonths(month, 1) <= startOfMonth(dayToDate(today));
}

/** "Ekim 2026". */
export function monthTitle(month: Date): string {
  return `${MONTH_NAMES[month.getMonth()]} ${month.getFullYear()}`;
}

/** "12 Ekim Pazartesi". */
export function dayTitle(localDate: string): string {
  const date = dayToDate(localDate);
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${WEEKDAY_NAMES[(date.getDay() + 6) % 7]}`;
}

/** Whether a route parameter is a real day up to today (a past day can be opened, a future one not). */
export function isOpenableDay(param: string | undefined, today: string): param is string {
  if (!param || !/^\d{4}-\d{2}-\d{2}$/.test(param)) return false;
  return dayKey(dayToDate(param)) === param && param <= today;
}

/** The day switcher on Bugün (design proposal K4): `delta` days from `localDate`, never past today. */
export function shiftDay(localDate: string, delta: number, today: string): string {
  const date = dayToDate(localDate);
  const next = dayKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() + delta));
  return next > today ? today : next;
}

/** The switcher's label: "Bugün", "Dün", else the day's title. */
export function dayLabel(localDate: string, today: string): string {
  if (localDate === today) return "Bugün";
  return localDate === shiftDay(today, -1, today) ? "Dün" : dayTitle(localDate);
}
