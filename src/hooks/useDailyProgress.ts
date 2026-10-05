"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MACRO_LABELS } from "@/lib/labels";
import { DAY_END_HOUR, buildInsights } from "@/lib/nutrition/insights";
import { rateDay } from "@/lib/nutrition/dayRating";
import { itemMacros, progressOf, sumMacros } from "@/lib/nutrition/macros";
import { microReferences, sumMicros } from "@/lib/nutrition/micros";
import { slotTargets } from "@/lib/nutrition/slots";
import { MEAL_SLOTS, type MealDTO, type MealSlot } from "@/types/meal";
import type { MealPattern } from "@/types/plan";
import type { MacroKey, Macros, MealItem } from "@/types/nutrition";
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
  const rating = key === "calories" ? rateDay(value, goal) : null;
  const over = key === "calories" ? rating === "over" : key !== "protein" && ratio > 1;
  const reached = key === "protein" ? ratio >= 1 : rating === "onTarget";
  return { key, label: MACRO_LABELS[key], value, goal, progress: progressOf(value, goal), over, reached };
}

/**
 * Today's totals against the targets as ring data, plus the smart summary. When a goal is reached
 * during the session (not already on page load), it toasts once and flags the ring to animate.
 */
export interface SlotProgress {
  slot: MealSlot;
  meals: MealDTO[];
  /** The same meals with each component's macros for its portion (for the item rows). */
  entries: { meal: MealDTO; items: (MealItem & { macros: Macros })[] }[];
  /** Share of the slot's energy from protein / carbs / fat (0–1 each; 0 when empty). */
  energyShare: { protein: number; carbs: number; fat: number };
  /** When the first meal of this slot was logged (ISO), null if none. */
  firstLoggedAt: string | null;
  calories: number;
  /** kcal target for this slot from the meal pattern; null when the pattern skips it (16:8 breakfast). */
  goal: number | null;
  /** Clearly above its share (more than 15 % over; slots are a guide, not a limit). */
  over: boolean;
}

const SLOT_OVER_TOLERANCE = 0.15;

export function useDailyProgress(meals: MealDTO[], targets: Macros, loading: boolean, mealPattern: MealPattern = "classic") {
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

  const micros = useMemo(() => {
    const totals = sumMicros(meals.flatMap((m) => m.items));
    return { ...totals, references: microReferences(targets.calories) };
  }, [meals, targets.calories]);

  /** Today's meals grouped by slot (in day order), each with its share of the calorie target. */
  const slots: SlotProgress[] = useMemo(() => {
    const goals = slotTargets(targets.calories, mealPattern);
    return MEAL_SLOTS.flatMap((slot) => {
      const slotMeals = meals.filter((m) => m.slot === slot);
      const goal = goals[slot] ?? null;
      if (slotMeals.length === 0 && goal === null) return [];
      const totals = sumMacros(slotMeals);
      const calories = Math.round(totals.calories);
      const energy = { protein: totals.protein * 4, carbs: totals.carbs * 4, fat: totals.fat * 9 };
      const all = energy.protein + energy.carbs + energy.fat;
      return [
        {
          slot,
          meals: slotMeals,
          entries: slotMeals.map((meal) => ({ meal, items: meal.items.map((item) => ({ ...item, macros: itemMacros(item) })) })),
          energyShare: all > 0 ? { protein: energy.protein / all, carbs: energy.carbs / all, fat: energy.fat / all } : { protein: 0, carbs: 0, fat: 0 },
          firstLoggedAt: slotMeals.reduce<string | null>((first, m) => (first === null || m.createdAt < first ? m.createdAt : first), null),
          calories,
          goal,
          over: goal !== null && calories > goal * (1 + SLOT_OVER_TOLERANCE),
        },
      ];
    });
  }, [meals, targets.calories, mealPattern]);

  return {
    totals,
    micros,
    slots,
    rings,
    calorieRing: rings[0],
    macroRings: rings.slice(1),
    remaining: Math.round(targets.calories - totals.calories),
    insights,
    summaryTitle: hour >= DAY_END_HOUR ? "Gün sonu özeti" : "Şu ana kadar",
  };
}
