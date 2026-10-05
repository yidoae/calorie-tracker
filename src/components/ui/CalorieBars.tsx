"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { SPRING } from "./motion";
import { LOCALE } from "@/lib/dates";

export interface CalorieBar {
  key: string;
  label: string;
  /** null = nothing logged that day (no bar, not a zero). */
  calories: number | null;
  goal: number;
  /** Short status for the tooltip, e.g. "Hedefte". */
  status: string | null;
}

const fmt = (n: number) => Math.round(n).toLocaleString(LOCALE);

/**
 * Daily calories as bars with each day's goal as a tick across the bar slot (goals differ on
 * training/rest days). Hover or focus a day for its numbers; a table carries the same data.
 */
export default function CalorieBars({ bars }: { bars: CalorieBar[] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...bars.map((b) => Math.max(b.calories ?? 0, b.goal))) * 1.1;
  const pct = (n: number) => (n / max) * 100;
  const bar = active !== null ? bars[active] : null;
  const dense = bars.length > 31;

  return (
    <figure className="m-0">
      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-muted" aria-hidden>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-[2px] bg-macro-calories" /> Alınan kalori
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-cta" /> Günlük hedef
        </span>
      </div>

      <div className="relative h-44 border-b border-border" onMouseLeave={() => setActive(null)}>
        <div className={`absolute inset-0 flex items-end ${dense ? "gap-px" : "gap-0.5"}`}>
          {bars.map((b, i) => (
            <button
              key={b.key}
              type="button"
              aria-label={`${b.label}: ${b.calories === null ? "kayıt yok" : `${fmt(b.calories)} kcal`}, hedef ${fmt(b.goal)} kcal${b.status ? `, ${b.status}` : ""}`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              className="relative h-full min-w-0 flex-1 cursor-default outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {b.calories !== null && (
                <motion.span
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ ...SPRING, delay: Math.min(i * 0.012, 0.5) }}
                  className={`absolute inset-x-0 bottom-0 origin-bottom rounded-t-[4px] transition-colors duration-150 ${active === i ? "bg-ink-2" : "bg-macro-calories"}`}
                  style={{ height: `${pct(b.calories)}%` }}
                />
              )}
              {/* Overlaps the gap between bars so equal goals read as one continuous line. */}
              <span className={`absolute h-0.5 bg-cta ${dense ? "-inset-x-[0.5px]" : "-inset-x-px"}`} style={{ bottom: `${pct(b.goal)}%` }} />
            </button>
          ))}
        </div>
        {bar && active !== null && (
          <div
            role="status"
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-[6px] border border-border-strong bg-surface px-2 py-1 text-xs whitespace-nowrap shadow-pop"
            style={{ left: `${Math.min(85, Math.max(15, ((active + 0.5) / bars.length) * 100))}%` }}
          >
            <p className="font-semibold text-fg">{bar.label}</p>
            <p className="text-fg-muted tabular-nums">
              {bar.calories === null ? "Kayıt yok" : `${fmt(bar.calories)} kcal`} · hedef {fmt(bar.goal)}
            </p>
            {bar.status && <p className="text-fg-muted">{bar.status}</p>}
          </div>
        )}
      </div>
      <div aria-hidden className="mt-1 flex justify-between text-[11px] text-fg-subtle">
        <span>{bars[0]?.label}</span>
        <span>{bars[bars.length - 1]?.label}</span>
      </div>

      <div className="sr-only">
        <table>
          <caption>Günlük kalori ve hedef</caption>
          <thead>
            <tr>
              <th>Gün</th>
              <th>Kalori</th>
              <th>Hedef</th>
            </tr>
          </thead>
          <tbody>
            {bars.map((b) => (
              <tr key={b.key}>
                <td>{b.label}</td>
                <td>{b.calories === null ? "kayıt yok" : fmt(b.calories)}</td>
                <td>{fmt(b.goal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
