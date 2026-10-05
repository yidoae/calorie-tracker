"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { dayToDate, LOCALE } from "@/lib/dates";
import type { TrendPoint } from "@/lib/nutrition/weight";

interface Props {
  points: TrendPoint[];
  target: number | null;
}

const fmtKg = (n: number) => n.toLocaleString(LOCALE, { maximumFractionDigits: 1 });
const fmtDay = (day: string) => dayToDate(day).toLocaleDateString(LOCALE, { day: "numeric", month: "short" });

/**
 * Weigh-ins (dots) and their 7-day average (line), with the target as a dashed line. Hover or
 * focus a point for its values; the same data is available as a table for screen readers.
 */
export default function WeightChart({ points, target }: Props) {
  // Which point the tooltip shows; purely a display concern.
  const [active, setActive] = useState<number | null>(null);
  if (points.length < 2) return null;

  const values = points.flatMap((p) => [p.kg, p.trend]).concat(target !== null ? [target] : []);
  const pad = 0.5;
  const min = Math.floor(Math.min(...values) - pad);
  const max = Math.ceil(Math.max(...values) + pad);
  const x = (i: number) => (i / (points.length - 1)) * 100;
  const y = (kg: number) => ((max - kg) / (max - min)) * 100;
  const trendPath = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.trend)}`).join(" ");
  const point = active !== null ? points[active] : null;

  return (
    <figure className="m-0">
      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-muted" aria-hidden>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-fg-subtle" /> Tartı
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full bg-macro-protein" /> 7 günlük ortalama
        </span>
        {target !== null && (
          <span className="flex items-center gap-1.5">
            <span className="w-4 border-t-2 border-dashed border-fg-muted" /> Hedef {fmtKg(target)} kg
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <div aria-hidden className="flex flex-col justify-between py-0 text-[11px] text-fg-subtle tabular-nums">
          <span>{max}</span>
          <span>{min}</span>
        </div>
        <div className="relative h-32 flex-1 border-b border-l border-border" onMouseLeave={() => setActive(null)}>
          {/* Revealed left to right with a clip (pathLength can't be used with non-scaling strokes). */}
          <motion.svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 size-full overflow-visible"
            aria-hidden
            initial={{ clipPath: "inset(-8px 100% -8px -8px)" }}
            animate={{ clipPath: "inset(-8px -8px -8px -8px)" }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          >
            {target !== null && (
              <line
                x1="0"
                x2="100"
                y1={y(target)}
                y2={y(target)}
                className="stroke-fg-muted"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                vectorEffect="non-scaling-stroke"
              />
            )}
            <path
              d={trendPath}
              fill="none"
              className="stroke-macro-protein"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </motion.svg>
          {points.map((p, i) => (
            <button
              key={p.day}
              type="button"
              aria-label={`${fmtDay(p.day)}: ${fmtKg(p.kg)} kg, ortalama ${fmtKg(p.trend)} kg`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              className="absolute flex size-6 -translate-x-1/2 -translate-y-1/2 cursor-default items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{ left: `${x(i)}%`, top: `${y(p.kg)}%` }}
            >
              <motion.span
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: active === i ? 1.5 : 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 24, delay: active === null ? Math.min(i * 0.02, 0.6) : 0 }}
                className={`size-2 rounded-full ring-2 ring-surface ${active === i ? "bg-ink" : "bg-fg-subtle"}`}
              />
            </button>
          ))}
          {point && active !== null && (
            <div
              role="status"
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-[6px] border border-border-strong bg-surface px-2 py-1 text-xs whitespace-nowrap shadow-pop"
              style={{ left: `${Math.min(85, Math.max(15, x(active)))}%`, top: `calc(${y(point.kg)}% - 8px)` }}
            >
              <p className="font-semibold text-fg">{fmtDay(point.day)}</p>
              <p className="text-fg-muted tabular-nums">
                {fmtKg(point.kg)} kg · ort. {fmtKg(point.trend)} kg
              </p>
            </div>
          )}
        </div>
      </div>
      <div aria-hidden className="mt-1 flex justify-between pl-6 text-[11px] text-fg-subtle">
        <span>{fmtDay(points[0].day)}</span>
        <span>{fmtDay(points[points.length - 1].day)}</span>
      </div>

      <div className="sr-only">
        <table>
          <caption>Kilo geçmişi</caption>
          <thead>
            <tr>
              <th>Tarih</th>
              <th>Tartı (kg)</th>
              <th>7 günlük ortalama (kg)</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.day}>
                <td>{fmtDay(p.day)}</td>
                <td>{fmtKg(p.kg)}</td>
                <td>{fmtKg(p.trend)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
