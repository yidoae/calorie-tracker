"use client";

import { motion } from "motion/react";
import type { useWeekSeries } from "@/hooks/useWeekSeries";
import { LOCALE } from "@/lib/dates";
import type { DayPoint } from "@/lib/nutrition/trends";
import DashCard from "../ui/DashCard";
import { EASE_OUT } from "../ui/motion";

type Week = ReturnType<typeof useWeekSeries>;

const fmt = (n: number) => Math.round(n).toLocaleString(LOCALE);

const BAR: Record<"onTarget" | "under" | "over" | "today", string> = {
  onTarget: "bg-ink",
  under: "bg-fg-subtle",
  over: "bg-danger",
  today: "bg-cta",
};

const LEGEND = [
  { label: "Hedefte (±%5)", c: BAR.onTarget },
  { label: "Altında", c: BAR.under },
  { label: "Üstünde", c: BAR.over },
  { label: "Bugün, devam ediyor", c: BAR.today },
];

/**
 * "Son 7 gün": a bar per day (growing from the baseline one after another) against a dashed
 * target line; today in lime with a dashed outline of its goal. Days without a log show no bar.
 */
export default function WeekCard({ week, index, ready }: { week: Week; index: number; ready: boolean }) {
  const points = week.series;
  const top = Math.max(1000, ...points.map((d) => Math.max(d.totals.calories, d.goal.calories))) * 1.15;
  const pct = (kcal: number) => `${Math.min(1, kcal / top) * 100}%`;
  const todayGoal = points.at(-1)?.goal.calories ?? 0;
  const { summary } = week;

  return (
    <DashCard
      index={index}
      id="week-heading"
      eyebrow="Enerji · kcal"
      title="Son 7 gün"
      aside={
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-border bg-surface-2 px-3 py-1 text-[12.5px] font-semibold">
            Ortalama <b className="text-success-text tabular-nums">{summary.averageKcal !== null ? `${fmt(summary.averageKcal)} kcal` : "—"}</b>
          </span>
          <span className="rounded-full border border-border bg-surface-2 px-3 py-1 text-[12.5px] font-semibold">
            Hedefte{" "}
            <b className="text-success-text tabular-nums">{summary.loggedDays > 0 ? `${summary.onTargetDays}/${summary.loggedDays} gün` : "—"}</b>
          </span>
        </div>
      }
    >
      {!ready || week.loading ? (
        <div aria-hidden className="skeleton ml-12 h-[210px]" />
      ) : week.error ? (
        <p role="alert" className="alert alert-danger">
          {week.error}
        </p>
      ) : (
        <>
          <div className="relative mt-1.5 ml-12 h-[210px] border-b border-border-strong">
            {[1000, 2000, 3000].filter((v) => v < top).map((v) => (
              <div key={v} className="absolute inset-x-0 border-t border-border" style={{ bottom: pct(v) }}>
                <span className="absolute top-0 right-full mr-2 -translate-y-1/2 text-[10.5px] whitespace-nowrap text-fg-subtle tabular-nums">{fmt(v)}</span>
              </div>
            ))}
            {todayGoal > 0 && (
              <div className="absolute inset-x-0 border-t-[1.5px] border-dashed border-ink" style={{ bottom: pct(todayGoal) }}>
                <span className="absolute top-0 right-full mr-2 -translate-y-1/2 text-[10.5px] font-semibold whitespace-nowrap">Hedef</span>
              </div>
            )}
            <ol className="absolute inset-0 grid grid-cols-7 gap-[clamp(6px,1.4vw,14px)]" aria-label="Günlük kaloriler">
              {points.map((d, j) => (
                <Bar key={d.key} point={d} index={j} today={j === points.length - 1} height={pct(d.totals.calories)} goalHeight={pct(d.goal.calories)} />
              ))}
            </ol>
          </div>
          <div aria-hidden className="mt-2 ml-12 grid grid-cols-7 gap-[clamp(6px,1.4vw,14px)] text-center">
            {points.map((d, j) => {
              const today = j === points.length - 1;
              return (
                <span key={d.key} className={`text-xs leading-tight ${today ? "font-semibold" : "text-fg-muted"}`}>
                  {today ? "Bugün" : d.date.toLocaleDateString(LOCALE, { weekday: "short" })}
                  <b className="block text-[11px] font-medium opacity-75 tabular-nums">{d.date.getDate()}</b>
                </span>
              );
            })}
          </div>
          <ul className="mt-4 flex flex-wrap gap-x-3.5 gap-y-1 text-[12.5px] text-fg-muted">
            {LEGEND.map((l) => (
              <li key={l.label} className="inline-flex items-center gap-1.5">
                <i aria-hidden className={`size-2.5 rounded-[3px] ${l.c}`} />
                {l.label}
              </li>
            ))}
          </ul>
        </>
      )}
    </DashCard>
  );
}

function Bar({ point, index, today, height, goalHeight }: { point: DayPoint; index: number; today: boolean; height: string; goalHeight: string }) {
  const tone = today ? "today" : (point.rating ?? "under");
  const label = `${point.date.toLocaleDateString(LOCALE, { weekday: "long", day: "numeric" })}: ${
    point.logged ? `${fmt(point.totals.calories)} kcal, hedef ${fmt(point.goal.calories)}` : "kayıt yok"
  }`;
  return (
    <li className="relative h-full" aria-label={label}>
      {today && (
        <span aria-hidden className="absolute inset-x-0 bottom-0 mx-auto w-[min(40px,74%)] rounded-[10px_10px_4px_4px] border-[1.5px] border-dashed border-ink opacity-45" style={{ height: goalHeight }} />
      )}
      {(point.logged || today) && (
        <>
          <motion.span
            aria-hidden
            className={`absolute inset-x-0 bottom-0 mx-auto w-[min(40px,74%)] origin-bottom rounded-[10px_10px_4px_4px] ${BAR[tone]}`}
            style={{ height }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 1, ease: EASE_OUT, delay: 0.35 + index * 0.07 }}
          />
          <motion.span
            aria-hidden
            className={`absolute left-1/2 -translate-x-1/2 text-[10.5px] whitespace-nowrap tabular-nums ${today ? "font-semibold" : "text-fg-subtle"}`}
            style={{ bottom: `calc(${height} + 6px)` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.9 + index * 0.07 }}
          >
            {fmt(point.totals.calories)}
          </motion.span>
        </>
      )}
    </li>
  );
}
