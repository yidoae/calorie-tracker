"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MACRO_LABELS } from "@/lib/labels";
import { DAY_END_HOUR, buildInsights } from "@/lib/nutrition/insights";
import { progressOf, sumMacros } from "@/lib/nutrition/macros";
import type { MealDTO } from "@/types/meal";
import type { MacroKey, Macros } from "@/types/nutrition";
import { useIsClient } from "./useIsClient";
import { useToast } from "./useToast";

export interface RingState {
  key: MacroKey;
  label: string;
  value: number;
  goal: number;
  /** 0–1 for the ring. */
  progress: number;
  /** Over a "max" target (calories/carbs/fat). */
  over: boolean;
  /** The goal counts as met (protein: reached the minimum; calories: within ±5%). */
  reached: boolean;
  /** Reached during this session, for the one-off celebration animation. */
  celebrating: boolean;
}

const CELEBRATE_MS = 2600;
/** Only these trigger a celebration; carbs and fat are limits, not goals. */
const CELEBRATED: MacroKey[] = ["calories", "protein"];

function ringFor(key: MacroKey, value: number, goal: number): Omit<RingState, "celebrating"> {
  const ratio = goal > 0 ? value / goal : 0;
  const over = key === "calories" ? ratio > 1.05 : key !== "protein" && ratio > 1;
  const reached = key === "protein" ? ratio >= 1 : key === "calories" ? ratio >= 0.95 && !over : false;
  return { key, label: MACRO_LABELS[key], value, goal, progress: progressOf(value, goal), over, reached };
}

/**
 * Today's totals against the targets as ring data, plus the smart summary. When a goal is reached
 * during the session (not already on page load), it toasts once and flags the ring to animate.
 */
export function useDailyProgress(meals: MealDTO[], targets: Macros, loading: boolean) {
  const toast = useToast();
  const isClient = useIsClient();
  const totals = useMemo(() => sumMacros(meals), [meals]);

  const base = useMemo(
    () => (["calories", "protein", "carbs", "fat"] as const).map((key) => ringFor(key, totals[key], targets[key])),
    [totals, targets],
  );

  // Which goals were already met; null until the first load, so reloading the page doesn't celebrate.
  const reachedBefore = useRef<Set<MacroKey> | null>(null);
  const [celebrating, setCelebrating] = useState<Set<MacroKey>>(() => new Set());

  useEffect(() => {
    if (loading) return;
    const reachedNow = new Set(base.filter((r) => r.reached).map((r) => r.key));
    const before = reachedBefore.current;
    reachedBefore.current = reachedNow;
    if (!before) return;

    const fresh = CELEBRATED.filter((k) => reachedNow.has(k) && !before.has(k));
    if (fresh.length === 0) return;
    for (const key of fresh) {
      toast.celebrate(key === "protein" ? "Protein hedefine ulaştın!" : "Kalori hedefine ulaştın!", "Harika gidiyorsun, böyle devam.");
    }
    setCelebrating(new Set(fresh));
    const timer = setTimeout(() => setCelebrating(new Set()), CELEBRATE_MS);
    return () => clearTimeout(timer);
  }, [base, loading, toast]);

  const rings: RingState[] = useMemo(() => base.map((r) => ({ ...r, celebrating: celebrating.has(r.key) })), [base, celebrating]);

  // The hour differs between server and browser, so the summary is computed after hydration.
  const hour = isClient ? new Date().getHours() : 12;
  const insights = useMemo(
    () => (isClient && !loading ? buildInsights({ eaten: totals, targets, mealCount: meals.length, hour }) : []),
    [isClient, loading, totals, targets, meals.length, hour],
  );

  return {
    totals,
    rings,
    calorieRing: rings[0],
    macroRings: rings.slice(1),
    remaining: Math.round(targets.calories - totals.calories),
    insights,
    summaryTitle: hour >= DAY_END_HOUR ? "Gün sonu özeti" : "Şu ana kadar",
  };
}
