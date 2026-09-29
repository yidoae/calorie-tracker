"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useIsClient } from "@/hooks/useIsClient";
import { useMealCalendar } from "@/hooks/useMealCalendar";
import { LOCALE, dayKey, monthGrid } from "@/lib/dates";
import type { MealDTO } from "@/types/meal";
import type { Macros } from "@/types/nutrition";
import DayDetail from "./DayDetail";

interface Props {
  targets: Macros;
  onDelete: (meal: MealDTO) => void;
  onClearDay: (ids: string[]) => void;
}

// 2024-01-01 is a Monday, so this yields Monday-first weekday initials in the user's locale.
const WEEKDAYS = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(LOCALE, { weekday: "narrow" }));

export default function MealCalendar(props: Props) {
  // Dates and locale differ between server and browser, so render the calendar client-side only.
  const isClient = useIsClient();
  return isClient ? (
    <CalendarView {...props} />
  ) : (
    <div aria-hidden className="space-y-3">
      <div className="skeleton h-80 rounded-[10px]" />
      <div className="skeleton h-40 rounded-[10px]" />
    </div>
  );
}

function CalendarView({ targets, onDelete, onClearDay }: Props) {
  const cal = useMealCalendar(targets);
  const monthLabel = cal.month.toLocaleDateString(LOCALE, { month: "long", year: "numeric" });
  const selectedLabel = cal.selected.toLocaleDateString(LOCALE, { weekday: "long", month: "long", day: "numeric" });
  const navButton = "btn btn-ghost btn-icon-sm disabled:hover:bg-transparent";

  return (
    <div className="space-y-3">
      <div className="card p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between">
          <button type="button" aria-label="Önceki ay" onClick={cal.previousMonth} className={navButton}>
            <ChevronLeft aria-hidden className="size-4" />
          </button>
          <h3 aria-live="polite" className="font-display text-base">
            {monthLabel}
          </h3>
          <button type="button" aria-label="Sonraki ay" disabled={cal.isCurrentMonth} onClick={cal.nextMonth} className={navButton}>
            <ChevronRight aria-hidden className="size-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 text-center sm:gap-1">
          {WEEKDAYS.map((label, i) => (
            <span key={i} aria-hidden className="pb-1.5 text-[11px] font-medium text-fg-subtle uppercase">
              {label}
            </span>
          ))}

          {monthGrid(cal.month).map((date, i) => {
            if (!date) return <span key={i} />;
            const key = dayKey(date);
            const dayMeals = cal.mealsOn(key);
            const future = key > cal.todayKey; // YYYY-MM-DD keys sort chronologically
            const label = date.toLocaleDateString(LOCALE, { weekday: "long", month: "long", day: "numeric" });
            const isSelected = key === cal.selectedKey;

            return (
              <button
                key={key}
                type="button"
                disabled={future}
                onClick={() => cal.select(date)}
                aria-label={dayMeals ? `${label}, ${dayMeals.length} öğün` : label}
                aria-current={key === cal.todayKey ? "date" : undefined}
                aria-pressed={isSelected}
                className={`relative flex aspect-square max-h-10 w-full cursor-pointer flex-col items-center justify-center rounded-lg text-[13px] tabular-nums outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:text-on-ink-muted disabled:hover:bg-transparent ${
                  isSelected
                    ? "bg-ink font-semibold text-on-ink"
                    : key === cal.todayKey
                      ? "font-semibold text-accent-text ring-1 ring-accent/40 ring-inset hover:bg-accent-soft"
                      : "text-fg hover:bg-surface-2"
                }`}
              >
                {date.getDate()}
                {dayMeals && (
                  <span
                    aria-hidden
                    className={`absolute bottom-1 size-1 rounded-full ${isSelected ? "bg-cta" : cal.overGoal(key) ? "bg-danger" : "bg-accent"}`}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex min-h-5 flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-3 text-xs text-fg-subtle">
          {cal.error ? (
            <p role="alert" className="text-danger-text">
              {cal.error}
            </p>
          ) : cal.loading ? (
            <div aria-label="Yükleniyor" className="skeleton h-3 w-40" />
          ) : (
            <>
              <span className="flex items-center gap-1.5">
                <span aria-hidden className="size-1.5 rounded-full bg-accent" /> Kayıtlı
              </span>
              <span className="flex items-center gap-1.5">
                <span aria-hidden className="size-1.5 rounded-full bg-danger" /> Kalori hedefi aşıldı
              </span>
            </>
          )}
        </div>
      </div>

      <section aria-labelledby="day-heading" className="card p-4">
        <h3 id="day-heading" className="card-title mb-4">
          {cal.selectedInView ? selectedLabel : "Bir gün seç"}
        </h3>
        {!cal.selectedInView ? (
          <p className="text-[13px] text-fg-subtle">Öğünlerini ve toplamlarını görmek için bir gün seç.</p>
        ) : cal.error ? (
          <p className="text-[13px] text-danger-text">Bu ay yüklenemedi.</p>
        ) : cal.loading ? (
          <div aria-busy="true" aria-label="Gün yükleniyor" className="space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="skeleton h-3 w-1/3" />
                <div className="skeleton h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <DayDetail meals={cal.selectedMeals} targets={targets} onDelete={onDelete} onClearDay={onClearDay} />
        )}
      </section>
    </div>
  );
}
