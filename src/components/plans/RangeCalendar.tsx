"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { addMonths, dayKey, dayToDate, LOCALE, monthGrid, startOfMonth } from "@/lib/dates";
import { firstFreeDay, lastSelectableEnd, periodOn, pickDay, type RangeDraft } from "@/lib/nutrition/schedule";
import type { PlanPeriod } from "@/types/plan";
import { GOAL_STYLES } from "./goalStyles";

interface Props {
  value: RangeDraft;
  onChange: (next: RangeDraft) => void;
  /** Every saved period: their days are shown and can't be picked. */
  periods: PlanPeriod[];
  /** The period being edited, so its own days stay pickable. */
  ignoreId?: string;
}

const WEEKDAYS = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(LOCALE, { weekday: "narrow" }));
const STRIPES = "bg-[repeating-linear-gradient(135deg,transparent_0_4px,rgb(0_0_0/0.07)_4px_6px)]";

/**
 * Month calendar for picking an inclusive date range: click the first day, then the last.
 * While only the start is set, hovering previews the range. Other periods' days are tinted in
 * their goal colour and disabled, and days past the next period are disabled too, so a range can
 * never overlap one.
 */
export default function RangeCalendar({ value, onChange, periods, ignoreId }: Props) {
  // Open on the picked range, else on the first day from today that no other period has taken.
  const [month, setMonth] = useState(() => startOfMonth(dayToDate(value.start ?? firstFreeDay(dayKey(new Date()), periods, ignoreId))));
  const [hover, setHover] = useState<string | null>(null);
  const todayKey = dayKey(new Date());
  const others = periods.filter((p) => p.id !== ignoreId);

  const picking = value.start !== null && value.end === null;
  const limit = picking ? lastSelectableEnd(value.start!, periods, ignoreId) : null;
  const previewEnd = picking && hover && hover >= value.start! && (limit === null || hover <= limit) ? hover : null;
  const rangeEnd = value.end ?? previewEnd;
  const monthLabel = month.toLocaleDateString(LOCALE, { month: "long", year: "numeric" });

  return (
    <div onMouseLeave={() => setHover(null)}>
      <div className="mb-2 flex items-center justify-between">
        <button type="button" aria-label="Önceki ay" onClick={() => setMonth((m) => addMonths(m, -1))} className="btn btn-ghost btn-icon-sm">
          <ChevronLeft aria-hidden className="size-4" />
        </button>
        <h3 aria-live="polite" className="font-display text-base capitalize">
          {monthLabel}
        </h3>
        <button type="button" aria-label="Sonraki ay" onClick={() => setMonth((m) => addMonths(m, 1))} className="btn btn-ghost btn-icon-sm">
          <ChevronRight aria-hidden className="size-4" />
        </button>
      </div>

      <div aria-hidden className="grid grid-cols-7 text-center">
        {WEEKDAYS.map((label, i) => (
          <span key={i} className="pb-1.5 text-[11px] font-medium text-fg-subtle uppercase">
            {label}
          </span>
        ))}
      </div>

      <div role="group" aria-label={`${monthLabel} günleri`} className="grid grid-cols-7 gap-y-1 text-center">
        {monthGrid(month).map((date, i) => {
          if (!date) return <span key={i} />;
          const key = dayKey(date);
          const taken = periodOn(others, key);
          const beyondLimit = picking && limit !== null && key > limit;
          const isStart = key === value.start;
          const isEnd = key === rangeEnd;
          const inRange = value.start !== null && rangeEnd !== null && key >= value.start && key <= rangeEnd;
          const label = date.toLocaleDateString(LOCALE, { weekday: "long", day: "numeric", month: "long" });

          // The range band is drawn on the cell; the round "pill" sits on the button inside.
          const band = inRange && !(isStart && isEnd) ? `bg-accent-soft ${isStart ? "rounded-l-full" : ""} ${isEnd ? "rounded-r-full" : ""}` : "";
          return (
            <div key={key} className={band}>
              <button
                type="button"
                disabled={taken !== null || beyondLimit}
                onClick={() => onChange(pickDay(value, key, periods, ignoreId))}
                onMouseEnter={() => setHover(key)}
                onFocus={() => setHover(key)}
                aria-label={taken ? `${label}, ${taken.title} dönemi` : label}
                aria-pressed={isStart || isEnd || inRange}
                aria-current={key === todayKey ? "date" : undefined}
                className={`relative mx-auto flex size-9 cursor-pointer items-center justify-center rounded-full text-[13px] tabular-nums outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed ${
                  isStart || isEnd
                    ? "bg-ink font-semibold text-on-ink"
                    : taken
                      ? `${GOAL_STYLES[taken.plan.inputs.goal].soft} ${STRIPES} text-fg-subtle`
                      : beyondLimit
                        ? "text-fg-subtle/50"
                        : key === todayKey
                          ? "font-semibold text-accent-text ring-1 ring-accent/40 ring-inset hover:bg-accent-soft"
                          : "text-fg hover:bg-surface-2"
                }`}
              >
                {date.getDate()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
