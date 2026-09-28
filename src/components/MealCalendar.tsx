"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { LOCALE, addMonths, dayKey, monthGrid, startOfMonth } from "@/lib/dates";
import type { Macros } from "@/lib/goals";
import { sumMacros } from "@/lib/goals";
import type { MealDTO } from "@/lib/types";
import { useIsClient } from "@/lib/useIsClient";
import DayDetail from "./DayDetail";

interface Props {
  targets: Macros;
  /** Bump to refetch the visible month after meals are added or deleted. */
  refreshKey: number;
  onDelete: (id: string) => void;
  onClearDay: (ids: string[]) => void;
}

interface MonthData {
  key: string; // the month these meals belong to, e.g. "2026-09"
  meals: MealDTO[];
  error: string | null;
}

// 2024-01-01 is a Monday, so this yields Monday-first weekday initials in the user's locale.
const WEEKDAYS = Array.from({ length: 7 }, (_, i) =>
  new Date(2024, 0, 1 + i).toLocaleDateString(LOCALE, { weekday: "narrow" }),
);

export default function MealCalendar(props: Props) {
  // Dates and locale differ between server and browser, so render the calendar client-side only.
  const isClient = useIsClient();
  return isClient ? (
    <CalendarView {...props} />
  ) : (
    <div aria-hidden className="space-y-3">
      <div className="skeleton h-80 rounded-xl" />
      <div className="skeleton h-40 rounded-xl" />
    </div>
  );
}

function CalendarView({ targets, refreshKey, onDelete, onClearDay }: Props) {
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

  const monthLabel = month.toLocaleDateString(LOCALE, { month: "long", year: "numeric" });
  const navButton = "btn btn-ghost btn-icon-sm disabled:hover:bg-transparent";

  const selectedLabel = selected.toLocaleDateString(LOCALE, { weekday: "long", month: "long", day: "numeric" });
  const selectedInView = selectedKey.slice(0, 7) === monthKey;

  return (
    <div className="space-y-3">
      <div className="card p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between">
          <button type="button" aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))} className={navButton}>
            <ChevronLeft aria-hidden className="size-4" />
          </button>
          <h3 aria-live="polite" className="text-sm font-semibold">
            {monthLabel}
          </h3>
          <button
            type="button"
            aria-label="Next month"
            disabled={isCurrentMonth}
            onClick={() => setMonth(addMonths(month, 1))}
            className={navButton}
          >
            <ChevronRight aria-hidden className="size-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 text-center sm:gap-1">
          {WEEKDAYS.map((label, i) => (
            <span key={i} aria-hidden className="pb-1.5 text-[11px] font-medium text-fg-subtle uppercase">
              {label}
            </span>
          ))}

          {monthGrid(month).map((date, i) => {
            if (!date) return <span key={i} />;

            const key = dayKey(date);
            const dayMeals = byDay.get(key);
            const future = key > todayKey; // YYYY-MM-DD keys sort chronologically
            const overGoal = dayMeals ? sumMacros(dayMeals).calories > targets.calories : false;
            const label = date.toLocaleDateString(LOCALE, { weekday: "long", month: "long", day: "numeric" });

            return (
              <button
                key={key}
                type="button"
                disabled={future}
                onClick={() => setSelected(date)}
                aria-label={dayMeals ? `${label}, ${dayMeals.length} ${dayMeals.length === 1 ? "meal" : "meals"}` : label}
                aria-current={key === todayKey ? "date" : undefined}
                aria-pressed={key === selectedKey}
                className={`relative flex aspect-square max-h-10 w-full cursor-pointer flex-col items-center justify-center rounded-lg text-[13px] tabular-nums outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:text-fg-subtle/40 disabled:hover:bg-transparent ${
                  key === selectedKey
                    ? "bg-fg font-semibold text-bg"
                    : key === todayKey
                      ? "font-semibold text-accent-text ring-1 ring-accent/40 ring-inset hover:bg-accent-soft"
                      : "text-fg hover:bg-surface-2"
                }`}
              >
                {date.getDate()}
                {dayMeals && (
                  <span
                    aria-hidden
                    className={`absolute bottom-1 size-1 rounded-full ${
                      key === selectedKey ? "bg-bg" : overGoal ? "bg-danger" : "bg-accent"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex min-h-5 flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-3 text-xs text-fg-subtle">
          {data?.error ? (
            <p role="alert" className="text-danger-text">
              {data.error}
            </p>
          ) : loading ? (
            <div aria-label="Loading" className="skeleton h-3 w-40" />
          ) : (
            <>
              <span className="flex items-center gap-1.5">
                <span aria-hidden className="size-1.5 rounded-full bg-accent" /> Logged
              </span>
              <span className="flex items-center gap-1.5">
                <span aria-hidden className="size-1.5 rounded-full bg-danger" /> Over calorie target
              </span>
            </>
          )}
        </div>
      </div>

      <section aria-labelledby="day-heading" className="card p-4">
        <h3 id="day-heading" className="card-title mb-4">
          {selectedInView ? selectedLabel : "Select a day"}
        </h3>
        {!selectedInView ? (
          <p className="text-[13px] text-fg-subtle">Pick a day to see its meals and totals.</p>
        ) : data?.error ? (
          <p className="text-[13px] text-danger-text">Couldn&apos;t load this month.</p>
        ) : loading ? (
          <div aria-busy="true" aria-label="Loading day" className="space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="skeleton h-3 w-1/3" />
                <div className="skeleton h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <DayDetail meals={byDay.get(selectedKey) ?? []} targets={targets} onDelete={onDelete} onClearDay={onClearDay} />
        )}
      </section>
    </div>
  );
}
