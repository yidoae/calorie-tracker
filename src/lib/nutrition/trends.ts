import type { MealDTO } from "@/types/meal";
import type { Macros } from "@/types/nutrition";
import { dayKey } from "../dates";
import { rateDay, type DayRating } from "./dayRating";
import { sumMacros } from "./macros";

/*
 * Trends over a window of days: per-day totals against that day's target, logging streaks and
 * averages. Days without any meal are "not logged", never counted as zero-calorie days.
 */

export interface DayPoint {
  key: string;
  date: Date;
  logged: boolean;
  totals: Macros;
  goal: Macros;
  rating: DayRating | null;
}

/** The last `days` local days ending on `today`, oldest first. */
export function dailySeries(meals: readonly MealDTO[], days: number, today: Date, goalFor: (date: Date) => Macros): DayPoint[] {
  const byDay = new Map<string, MealDTO[]>();
  for (const meal of meals) {
    const key = dayKey(new Date(meal.createdAt));
    byDay.set(key, [...(byDay.get(key) ?? []), meal]);
  }
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1 - i));
    const key = dayKey(date);
    const dayMeals = byDay.get(key) ?? [];
    const totals = sumMacros(dayMeals);
    const goal = goalFor(date);
    const logged = dayMeals.length > 0;
    return { key, date, logged, totals, goal, rating: logged ? rateDay(totals.calories, goal.calories) : null };
  });
}

/**
 * Logging streaks over the series. The current streak may end yesterday: today isn't over, so an
 * unlogged today doesn't break it.
 */
export function streaks(series: readonly DayPoint[]): { current: number; best: number } {
  let best = 0;
  let run = 0;
  for (const day of series) {
    run = day.logged ? run + 1 : 0;
    best = Math.max(best, run);
  }
  let current = 0;
  const lastIndex = series.length - 1;
  const start = lastIndex >= 0 && !series[lastIndex].logged ? lastIndex - 1 : lastIndex;
  for (let i = start; i >= 0 && series[i].logged; i--) current += 1;
  return { current, best };
}

export interface TrendSummary {
  loggedDays: number;
  onTargetDays: number;
  /** Averages over logged days only. */
  average: Macros | null;
  averageGoal: Macros | null;
}

function average(list: Macros[]): Macros {
  const sum = sumMacros(list);
  const n = list.length;
  return { calories: Math.round(sum.calories / n), protein: Math.round(sum.protein / n), carbs: Math.round(sum.carbs / n), fat: Math.round(sum.fat / n) };
}

export function summarize(series: readonly DayPoint[]): TrendSummary {
  const logged = series.filter((d) => d.logged);
  if (logged.length === 0) return { loggedDays: 0, onTargetDays: 0, average: null, averageGoal: null };
  return {
    loggedDays: logged.length,
    onTargetDays: logged.filter((d) => d.rating === "onTarget").length,
    average: average(logged.map((d) => d.totals)),
    averageGoal: average(logged.map((d) => d.goal)),
  };
}
