import { dayKey, shiftDay } from "@/lib/dates";
import type { DayRange, NutritionPlan, PlanGoal, PlanPeriod } from "@/types/plan";

/*
 * Plan periods: which plan applies on which day. `YYYY-MM-DD` keys sort chronologically, so plain
 * string comparison is enough for every range check here.
 */

export interface PlanSchedule {
  /** The main plan: applies on every day no period covers. */
  nutritionPlan: NutritionPlan | null;
  /** Non-overlapping periods sorted by start date. */
  planPeriods: PlanPeriod[];
}

export type PeriodStatus = "active" | "upcoming" | "past";

export function periodOn(periods: PlanPeriod[], key: string): PlanPeriod | null {
  return periods.find((p) => p.start <= key && key <= p.end) ?? null;
}

/** The plan in effect on `date`: its period's plan, else the main plan. */
export function planOn(schedule: PlanSchedule, date: Date): NutritionPlan | null {
  return periodOn(schedule.planPeriods, dayKey(date))?.plan ?? schedule.nutritionPlan;
}

export function periodStatus(period: DayRange, todayKey: string): PeriodStatus {
  if (todayKey < period.start) return "upcoming";
  return todayKey > period.end ? "past" : "active";
}

/** The first period sharing a day with `range`, skipping `ignoreId` (the one being edited). */
export function findOverlap(periods: PlanPeriod[], range: DayRange, ignoreId?: string): PlanPeriod | null {
  return periods.find((p) => p.id !== ignoreId && p.start <= range.end && range.start <= p.end) ?? null;
}

const byStart = (a: PlanPeriod, b: PlanPeriod) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0);

/** Adds the period or replaces the one with its id; the result is sorted by start date. */
export function upsertPeriod(periods: PlanPeriod[], period: PlanPeriod): PlanPeriod[] {
  return [...periods.filter((p) => p.id !== period.id), period].sort(byStart);
}

export function removePeriod(periods: PlanPeriod[], id: string): PlanPeriod[] {
  return periods.filter((p) => p.id !== id);
}

/**
 * Sorted, overlap-free list from untrusted input: on a clash the earlier-starting period wins.
 * Used when reading settings, so a bad save can't make two plans claim the same day.
 */
export function normalizePeriods(periods: PlanPeriod[], max: number): PlanPeriod[] {
  const kept: PlanPeriod[] = [];
  for (const p of [...periods].sort(byStart)) {
    if (kept.length >= max) break;
    if (!findOverlap(kept, p) && !kept.some((k) => k.id === p.id)) kept.push(p);
  }
  return kept;
}

const DEFAULT_TITLES: Record<PlanGoal, string> = { cut: "Cut", bulk: "Bulk", maintain: "Koruma" };

export function defaultPlanTitle(goal: PlanGoal): string {
  return DEFAULT_TITLES[goal];
}

/** Days in an inclusive range (DST-safe: counts calendar days, not 24-hour blocks). */
export function rangeLength({ start, end }: DayRange): number {
  const utc = (k: string) => {
    const [y, m, d] = k.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((utc(end) - utc(start)) / 86_400_000) + 1;
}

/** A range being picked on the calendar: start first, then end. */
export interface RangeDraft {
  start: string | null;
  end: string | null;
}

/**
 * The last day a range starting on `start` may end on without running into another period, or
 * null when nothing lies ahead.
 */
export function lastSelectableEnd(start: string, periods: PlanPeriod[], ignoreId?: string): string | null {
  const next = periods.find((p) => p.id !== ignoreId && p.start > start);
  return next ? shiftDay(next.start, -1) : null;
}

/**
 * One click on day `key`: starts a range, closes it, or starts over. Days of other periods are
 * ignored, and a range never jumps over another period (that click starts a new range instead).
 */
export function pickDay(draft: RangeDraft, key: string, periods: PlanPeriod[], ignoreId?: string): RangeDraft {
  if (periodOn(periods.filter((p) => p.id !== ignoreId), key)) return draft;
  if (!draft.start || draft.end || key < draft.start) return { start: key, end: null };
  const limit = lastSelectableEnd(draft.start, periods, ignoreId);
  if (limit !== null && key > limit) return { start: key, end: null };
  return { start: draft.start, end: key };
}

/** `from`, or the first day after it that no period (other than `ignoreId`) covers. */
export function firstFreeDay(from: string, periods: PlanPeriod[], ignoreId?: string): string {
  let key = from;
  for (const p of periods) {
    if (p.id !== ignoreId && p.start <= key && key <= p.end) key = shiftDay(p.end, 1);
  }
  return key;
}
