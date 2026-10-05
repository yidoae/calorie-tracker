"use client";

import { Check } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { RingState } from "@/hooks/useDailyProgress";
import { LOCALE } from "@/lib/dates";
import { ROUTES } from "@/lib/routes";
import type { MacroKey } from "@/types/nutrition";
import AnimatedNumber from "../ui/AnimatedNumber";
import DashCard from "../ui/DashCard";
import { EASE_OUT, SPRING_BOUNCY } from "../ui/motion";

interface Props {
  index: number;
  calories: RingState;
  macros: RingState[];
  /** Day-type or custom-plan badge for the header. */
  badge?: ReactNode;
  /** Showing the built-in default targets (no plan yet). */
  defaultTargets: boolean;
}

const C = 110;
const R = 92;
const fmt = (n: number) => Math.round(n).toLocaleString(LOCALE);
const BAR: Record<Exclude<MacroKey, "calories">, string> = { protein: "bg-macro-protein", carbs: "bg-macro-carbs", fat: "bg-macro-fat" };
/** Twelve ticks around the ring, like a watch face (rounded so server and browser render the same numbers). */
const round2 = (n: number) => Math.round(n * 100) / 100;
const TICKS = Array.from({ length: 12 }, (_, i) => {
  const a = (i * Math.PI) / 6;
  return { key: i, x1: round2(C + 107 * Math.sin(a)), y1: round2(C - 107 * Math.cos(a)), x2: round2(C + 103 * Math.sin(a)), y2: round2(C - 103 * Math.cos(a)) };
});

/**
 * "Günlük enerji": the calorie ring (fills from zero on load, a dot rides its tip, turns red when
 * over), eaten / left with counting numbers, then the three macro bars.
 */
export default function EnergyCard({ index, calories, macros, badge, defaultTargets }: Props) {
  const progress = Math.min(1, calories.progress);
  const over = calories.over;
  const left = Math.round(calories.goal - calories.value);
  const delay = 0.35 + index * 0.09;

  return (
    <DashCard index={index} id="energy-heading" eyebrow="Bugün" title="Günlük enerji" aside={badge} tone="ink">
      <motion.div
        animate={calories.celebrating ? { scale: [1, 1.06, 1] } : { scale: 1 }}
        transition={SPRING_BOUNCY}
        className="relative mx-auto aspect-square w-full max-w-[232px]"
      >
        <svg viewBox="0 0 220 220" className="size-full overflow-visible" role="img" aria-label={`Kalori: ${fmt(calories.value)} / ${fmt(calories.goal)} kcal`}>
          {TICKS.map((t) => (
            <line
              key={t.key}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              className="stroke-ink-2"
              strokeWidth={2}
              strokeLinecap="round"
            />
          ))}
          <circle cx={C} cy={C} r={R} fill="none" className="stroke-ink-2" strokeWidth={16} />
          <motion.circle
            cx={C}
            cy={C}
            r={R}
            fill="none"
            strokeWidth={16}
            strokeLinecap="round"
            transform={`rotate(-90 ${C} ${C})`}
            className={`transition-[stroke] duration-300 ${over ? "stroke-danger" : "stroke-cta"}`}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: progress, opacity: progress > 0 ? 1 : 0 }}
            transition={{ duration: 1.5, ease: EASE_OUT, delay }}
          />
          <motion.g
            style={{ transformOrigin: `${C}px ${C}px`, transformBox: "view-box" }}
            initial={{ rotate: 0, opacity: 0 }}
            animate={{ rotate: progress * 360, opacity: progress > 0 ? 1 : 0 }}
            transition={{ duration: 1.5, ease: EASE_OUT, delay }}
          >
            <circle cx={C} cy={C - R} r={6} className={`fill-on-ink ${over ? "stroke-danger" : "stroke-cta"}`} strokeWidth={4} />
          </motion.g>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <AnimatedNumber value={calories.value} className="font-display text-5xl leading-none tabular-nums" />
          <span className="mt-1.5 text-xs text-on-ink-muted tabular-nums">/ {fmt(calories.goal)} kcal</span>
          <span
            className={`mt-2.5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors duration-300 ${
              over ? "bg-danger/25 text-danger-soft" : "bg-cta/15 text-cta"
            }`}
          >
            {calories.reached && <Check aria-hidden className="size-3" />}
            {over ? `${fmt(-left)} kcal fazla` : `${fmt(left)} kcal kaldı`}
          </span>
        </div>
      </motion.div>

      <dl className="mt-5 grid grid-cols-3 border-y border-ink-2 py-3 text-center">
        {[
          { label: "Hedef", value: calories.goal },
          { label: "Alınan", value: calories.value },
          { label: "Kalan", value: Math.max(0, left) },
        ].map((s, i) => (
          <div key={s.label} className={i > 0 ? "border-l border-ink-2" : ""}>
            <dt className="text-[11px] font-semibold tracking-[0.12em] text-on-ink-muted uppercase">{s.label}</dt>
            <dd className="font-display text-xl tabular-nums">
              <AnimatedNumber value={s.value} />
            </dd>
          </div>
        ))}
      </dl>

      <ul className="mt-5 space-y-3.5">
        {macros.map((m, i) => {
          const key = m.key as Exclude<MacroKey, "calories">;
          return (
            <li key={m.key}>
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <i aria-hidden className={`size-2.5 rounded-[3px] ${BAR[key]}`} />
                  {m.label}
                  {m.reached && <Check aria-label="hedefe ulaşıldı" className="size-3.5 text-cta" />}
                </span>
                <span className="text-xs text-on-ink-muted tabular-nums">
                  <b className="font-semibold text-on-ink">
                    <AnimatedNumber value={m.value} />
                  </b>{" "}
                  / {fmt(m.goal)} g
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-ink-2">
                <motion.div
                  className={`h-full rounded-full ${m.over ? "bg-danger" : BAR[key]}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(1, m.progress) * 100}%` }}
                  transition={{ duration: 1.3, ease: EASE_OUT, delay: delay + 0.1 + i * 0.08 }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      {defaultTargets && (
        <p className="mt-5 rounded-[10px] bg-ink-2 px-3 py-2 text-xs text-on-ink-muted">
          Varsayılan hedefler gösteriliyor.{" "}
          <Link href={ROUTES.plan} className="font-semibold text-cta underline-offset-4 hover:underline">
            Planını oluştur
          </Link>
          , kişisel hedeflerini gör.
        </p>
      )}
    </DashCard>
  );
}
