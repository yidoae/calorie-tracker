"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { addMonths, dayKey, monthGrid, startOfMonth } from "@/lib/dates";
import type { Macros } from "@/lib/goals";
import { sumMacros } from "@/lib/goals";
import type { MealDTO } from "@/lib/types";
import { useIsClient } from "@/lib/useIsClient";
import DayDetail from "./DayDetail";

interface Props {
  targets: Macros;
  /** Bump to refetch the visible month after meals are added or deleted. */
  refreshKey: number;
}

interface MonthData {
  key: string; // the month these meals belong to, e.g. "2026-09"
  meals: MealDTO[];
  error: string | null;
}

// 2024-01-01 is a Monday, so this yields Monday-first weekday initials in the user's locale.
const WEEKDAYS = Array.from({ length: 7 }, (_, i) =>
  new Date(2024, 0, 1 + i).toLocaleDateString(undefined, { weekday: "narrow" }),
);

export default function MealCalendar(props: Props) {
  // Dates and locale differ between server and browser, so render the calendar client-side only.
  const isClient = useIsClient();
  return isClient ? (
    <CalendarView {...props} />
  ) : (
    <div aria-hidden className="h-96 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
  );
}

function CalendarView({ targets, refreshKey }: Props) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => new Date());
  const [data, setData] = useState<MonthData | null>(null);

  const monthKey = dayKey(month).slice(0, 7);
  const today = new Date();
  const todayKey = dayKey(today);
  const isCurrentMonth = monthKey === todayKey.slice(0, 7);
  const selectedKey = dayKey(selected);

  useEffect(() => {
    let cancelled = false;
    const query = new URLSearchParams({
      from: month.toISOString(),
      to: addMonths(month, 1).toISOString(),
    });
    fetch(`/api/meals?${query}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load history"))))
      .then((meals: MealDTO[]) => {
        if (!cancelled) setData({ key: monthKey, meals, error: null });
      })
      .catch((err: Error) => {
        if (!cancelled) setData({ key: monthKey, meals: [], error: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [month, monthKey, refreshKey]);

  const loading = data?.key !== monthKey;

  // Meals grouped by local calendar day.
  const byDay = useMemo(() => {
    const groups = new Map<string, MealDTO[]>();
    if (data?.key !== monthKey) return groups;
    for (const meal of data.meals) {
      const key = dayKey(new Date(meal.createdAt));
      groups.set(key, [...(groups.get(key) ?? []), meal]);
    }
    return groups;
  }, [data, monthKey]);

  const monthLabel = month.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const navButton =
    "rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-zinc-800";

  const selectedLabel = selected.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const selectedInView = selectedKey.slice(0, 7) === monthKey;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3 flex items-center justify-between">
          <button type="button" aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))} className={navButton}>
            <ChevronLeft className="size-5" />
          </button>
          <h3 aria-live="polite" className="font-medium">
            {monthLabel}
          </h3>
          <button
            type="button"
            aria-label="Next month"
            disabled={isCurrentMonth}
            onClick={() => setMonth(addMonths(month, 1))}
            className={navButton}
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((label, i) => (
            <span key={i} aria-hidden className="pb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {label}
            </span>
          ))}

          {monthGrid(month).map((date, i) => {
            if (!date) return <span key={i} />;

            const key = dayKey(date);
            const dayMeals = byDay.get(key);
            const future = key > todayKey; // YYYY-MM-DD keys sort chronologically
            const overGoal = dayMeals ? sumMacros(dayMeals).calories > targets.calories : false;
            const label = date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

            return (
              <button
                key={key}
                type="button"
                disabled={future}
                onClick={() => setSelected(date)}
                aria-label={dayMeals ? `${label}, ${dayMeals.length} ${dayMeals.length === 1 ? "meal" : "meals"}` : label}
                aria-current={key === todayKey ? "date" : undefined}
                aria-pressed={key === selectedKey}
                className={`relative flex h-10 flex-col items-center justify-center rounded-xl text-sm tabular-nums transition-colors disabled:text-zinc-300 disabled:hover:bg-transparent dark:disabled:text-zinc-700 ${
                  key === selectedKey
                    ? "bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                } ${key === todayKey ? "ring-2 ring-emerald-600 ring-offset-1 ring-offset-white dark:ring-offset-zinc-900" : ""}`}
              >
                {date.getDate()}
                {dayMeals && (
                  <span
                    aria-hidden
                    className={`absolute bottom-1 size-1.5 rounded-full ${
                      key === selectedKey ? "bg-white" : overGoal ? "bg-red-500" : "bg-emerald-500"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          {data?.error ? (
            <p role="alert" className="text-red-600 dark:text-red-400">
              {data.error}
            </p>
          ) : loading ? (
            <p>Loading…</p>
          ) : (
            <>
              <span className="flex items-center gap-1.5">
                <span aria-hidden className="size-1.5 rounded-full bg-emerald-500" /> Logged
              </span>
              <span className="flex items-center gap-1.5">
                <span aria-hidden className="size-1.5 rounded-full bg-red-500" /> Over calorie target
              </span>
            </>
          )}
        </div>
      </div>

      <section
        aria-labelledby="day-heading"
        className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h3 id="day-heading" className="mb-3 font-medium">
          {selectedInView ? selectedLabel : "Select a day"}
        </h3>
        {!selectedInView ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Pick a day to see its meals and totals.</p>
        ) : data?.error ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Couldn&apos;t load this month.</p>
        ) : loading ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
        ) : (
          <DayDetail meals={byDay.get(selectedKey) ?? []} targets={targets} />
        )}
      </section>
    </div>
  );
}
