"use client";

import { CalendarPlus, ChevronRight } from "lucide-react";
import Link from "next/link";
import { addMonths, dayKey, LOCALE, shiftDay, startOfMonth } from "@/lib/dates";
import { periodStatus, rangeLength, type PeriodStatus } from "@/lib/nutrition/schedule";
import { ROUTES } from "@/lib/routes";
import type { NutritionPlan, PlanPeriod } from "@/types/plan";
import type { PeriodTarget } from "./PlanPeriodDialog";
import { GOAL_STYLES } from "./goalStyles";
import { formatRange } from "./format";

interface Props {
  mainPlan: NutritionPlan | null;
  mainPlanTitle: string | null;
  periods: PlanPeriod[];
  onOpen: (target: PeriodTarget) => void;
}

const TIMELINE_MONTHS = 3;
const STATUS: Record<PeriodStatus, { label: string; className: string }> = {
  active: { label: "Aktif", className: "bg-cta text-cta-fg" },
  upcoming: { label: "Sırada", className: "bg-surface-3 text-fg" },
  past: { label: "Bitti", className: "bg-surface-2 text-fg-subtle" },
};
const fmt = (n: number) => n.toLocaleString("tr-TR");

/**
 * "Planlarım": the main plan and the dated periods (Cut, Bulk…) that replace it, with a
 * three-month timeline on top. Tapping a period (on the timeline or in the list) opens it.
 */
export default function PlansCard({ mainPlan, mainPlanTitle, periods, onOpen }: Props) {
  const todayKey = dayKey(new Date());
  const ordered = [...periods.filter((p) => periodStatus(p, todayKey) !== "past"), ...periods.filter((p) => periodStatus(p, todayKey) === "past").reverse()];

  return (
    <section aria-labelledby="plans-heading" className="card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 id="plans-heading" className="card-title">
          Planlarım
        </h2>
        <Link href={`${ROUTES.plan}?yeni=1`} className="btn btn-soft h-8 px-3 text-xs">
          <CalendarPlus aria-hidden className="size-3.5" /> Yeni dönem
        </Link>
      </div>

      <Timeline periods={periods} todayKey={todayKey} onOpen={(period) => onOpen({ kind: "period", period })} />

      <ul className="mt-4 space-y-2">
        {ordered.map((p) => {
          const status = periodStatus(p, todayKey);
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onOpen({ kind: "period", period: p })}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-[10px] border border-border p-3 text-left outline-none transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-ring ${status === "past" ? "opacity-60" : ""}`}
              >
                <span aria-hidden className={`size-2.5 shrink-0 rounded-full ${GOAL_STYLES[p.plan.inputs.goal].dot}`} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{p.title}</span>
                  <span className="block truncate text-xs text-fg-muted">
                    {formatRange(p)} · {fmt(p.plan.base.calories)} kcal
                  </span>
                </span>
                <span className={`badge shrink-0 ${STATUS[status].className}`}>{STATUS[status].label}</span>
                <ChevronRight aria-hidden className="size-4 shrink-0 text-fg-subtle" />
              </button>
            </li>
          );
        })}

        {mainPlan && (
          <li>
            <button
              type="button"
              onClick={() => onOpen({ kind: "main", title: mainPlanTitle ?? "" })}
              className="flex w-full cursor-pointer items-center gap-3 rounded-[10px] border border-dashed border-border p-3 text-left outline-none transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span aria-hidden className={`size-2.5 shrink-0 rounded-full ${GOAL_STYLES[mainPlan.inputs.goal].dot}`} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {mainPlanTitle} <span className="font-normal text-fg-muted">· ana plan</span>
                </span>
                <span className="block truncate text-xs text-fg-muted">
                  {periods.length ? "Dönem dışındaki günlerde" : "Her gün"} · {fmt(mainPlan.base.calories)} kcal
                </span>
              </span>
              <ChevronRight aria-hidden className="size-4 shrink-0 text-fg-subtle" />
            </button>
          </li>
        )}
      </ul>

      {periods.length === 0 && (
        <p className="mt-3 text-[13px] text-fg-muted">
          Cut, Bulk gibi dönemler ekle ve takvimden tarihlerini seç. Tarihi gelince hedeflerin otomatik o plana geçer.
        </p>
      )}
    </section>
  );
}

/** Three months from the 1st of this month: periods as coloured bars, a tick for today. */
function Timeline({ periods, todayKey, onOpen }: { periods: PlanPeriod[]; todayKey: string; onOpen: (p: PlanPeriod) => void }) {
  const first = startOfMonth(new Date());
  const from = dayKey(first);
  const to = shiftDay(dayKey(addMonths(first, TIMELINE_MONTHS)), -1);
  const total = rangeLength({ start: from, end: to });
  const pct = (key: string) => ((rangeLength({ start: from, end: key }) - 1) / total) * 100;
  const months = Array.from({ length: TIMELINE_MONTHS }, (_, i) => addMonths(first, i));
  const visible = periods.filter((p) => p.end >= from && p.start <= to);

  return (
    <div className="mt-4">
      <div className="relative h-7 overflow-hidden rounded-full bg-surface-2">
        {visible.map((p) => {
          const start = p.start < from ? from : p.start;
          const end = p.end > to ? to : p.end;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onOpen(p)}
              title={`${p.title} · ${formatRange(p)}`}
              aria-label={`${p.title}, ${formatRange(p)}`}
              style={{ left: `${pct(start)}%`, width: `${(rangeLength({ start, end }) / total) * 100}%` }}
              className={`absolute inset-y-0 flex cursor-pointer items-center overflow-hidden px-2 text-[11px] font-semibold text-ink outline-none transition-[filter] hover:brightness-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ${GOAL_STYLES[p.plan.inputs.goal].bar}`}
            >
              <span className="truncate">{p.title}</span>
            </button>
          );
        })}
        <span aria-hidden style={{ left: `${pct(todayKey)}%` }} className="pointer-events-none absolute inset-y-0 w-0.5 bg-ink" />
      </div>
      <div aria-hidden className="relative mt-1 h-4 text-[11px] text-fg-subtle">
        {months.map((m) => (
          <span key={m.toISOString()} style={{ left: `${pct(dayKey(m))}%` }} className="absolute capitalize">
            {m.toLocaleDateString(LOCALE, { month: "short" })}
          </span>
        ))}
      </div>
    </div>
  );
}
