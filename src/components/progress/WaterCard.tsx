"use client";

import { Check, Loader2, Minus, Plus, Undo2 } from "lucide-react";
import { motion } from "motion/react";
import type { useWater } from "@/hooks/useWater";
import { GLASS_ML, WATER_STEPS } from "@/lib/nutrition/water";
import { WATER_GOAL_RANGE } from "@/types/settings";
import AnimatedNumber from "../ui/AnimatedNumber";
import DashCard from "../ui/DashCard";
import { SPRING, SPRING_BOUNCY } from "../ui/motion";

type Water = ReturnType<typeof useWater>;

const litres = (ml: number) => (ml / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 2 });

/**
 * "Su": a row of glasses that fill with a wave (tap an empty glass to drink up to it, tap the
 * last full one to take it back), the total against the goal, +250/+500 ml, undo and the goal.
 */
export default function WaterCard({ water, index }: { water: Water; index: number }) {
  const rest = Math.max(0, water.goal - water.total);

  return (
    <DashCard
      index={index}
      id="water-heading"
      eyebrow="Hidrasyon"
      title="Su"
      aside={
        <p className="font-display text-2xl tabular-nums">
          <AnimatedNumber value={water.total / 1000} format={(n) => litres(n * 1000)} />{" "}
          <small className="font-sans text-sm font-medium text-fg-muted">/ {litres(water.goal)} L</small>
        </p>
      }
    >
      {water.error ? (
        <p role="alert" className="text-[13px] text-danger-text">
          {water.error}
        </p>
      ) : water.loading ? (
        <div aria-hidden className="grid grid-cols-8 gap-2">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="skeleton h-14 rounded-[5px_5px_12px_12px]" />
          ))}
        </div>
      ) : (
        // Up to 8 glasses in one row; more are split into two even rows.
        <div
          role="group"
          aria-label="Bardaklar"
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${water.glasses <= 8 ? water.glasses : Math.ceil(water.glasses / 2)}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: water.glasses }, (_, i) => {
            const full = i < water.filled;
            return (
              <motion.button
                key={i}
                type="button"
                aria-label={`${i + 1}. bardak (${GLASS_ML} ml)`}
                aria-pressed={full}
                disabled={water.busy}
                onClick={() => water.tapGlass(i)}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.94 }}
                transition={SPRING}
                className={`relative h-14 cursor-pointer overflow-hidden rounded-[5px_5px_12px_12px] border-2 bg-surface-2 p-0 outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait ${
                  full ? "border-macro-carbs" : "border-border-strong hover:border-macro-carbs"
                }`}
              >
                <motion.span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 bg-macro-carbs"
                  initial={false}
                  animate={{ height: full ? "84%" : "0%" }}
                  transition={SPRING_BOUNCY}
                >
                  {/* A slowly turning rounded square cut out of the top edge reads as a wave. */}
                  <motion.span
                    className="absolute bottom-[calc(100%-5px)] -left-[60%] aspect-square w-[220%] rounded-[42%] bg-surface-2"
                    animate={{ rotate: 360 }}
                    transition={{ duration: i % 2 ? 6.5 : 5, ease: "linear", repeat: Infinity }}
                  />
                </motion.span>
              </motion.button>
            );
          })}
        </div>
      )}

      <p className="mt-3 flex items-center gap-1.5 text-[13px] text-fg-muted">
        {water.reached ? (
          <>
            <Check aria-hidden className="size-4 text-success-text" /> Bugünkü su hedefi tamam.
          </>
        ) : (
          `${Math.ceil(rest / GLASS_ML)} bardak daha (${litres(rest)} L). Her bardak ${GLASS_ML} ml.`
        )}
      </p>

      <div className="mt-3 flex gap-2">
        {WATER_STEPS.map((ml) => (
          <button key={ml} type="button" disabled={water.busy} onClick={() => water.add(ml)} className="btn btn-secondary h-9 flex-1 px-2">
            {water.busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Plus aria-hidden className="size-4" />}
            {ml} ml
          </button>
        ))}
        <button type="button" disabled={!water.canUndo} onClick={() => void water.undoLast()} aria-label="Son eklenen suyu geri al" className="btn btn-ghost btn-icon">
          <Undo2 aria-hidden className="size-4" />
        </button>
      </div>

      {water.signedIn && (
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3 text-xs text-fg-muted">
          <span>Günlük hedef</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Hedefi 250 ml azalt"
              disabled={water.goal <= WATER_GOAL_RANGE.min}
              onClick={() => water.setGoal(water.goal - WATER_GOAL_RANGE.step)}
              className="btn btn-ghost size-7 px-0"
            >
              <Minus aria-hidden className="size-3.5" />
            </button>
            <span className="w-14 text-center font-semibold text-fg tabular-nums">{litres(water.goal)} L</span>
            <button
              type="button"
              aria-label="Hedefi 250 ml artır"
              disabled={water.goal >= WATER_GOAL_RANGE.max}
              onClick={() => water.setGoal(water.goal + WATER_GOAL_RANGE.step)}
              className="btn btn-ghost size-7 px-0"
            >
              <Plus aria-hidden className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </DashCard>
  );
}
