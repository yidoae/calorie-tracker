"use client";

import { useMemo, useState } from "react";
import { itemMacros, roundMacros, totalOfItems } from "@/lib/nutrition/macros";
import type { CreateMealInput, MealDraft, MealSlot } from "@/types/meal";
import type { Macros, MealItem } from "@/types/nutrition";

/** Portion presets shown on each component, relative to the analyser's estimate. */
export const PORTION_STEPS = [0.5, 1, 1.5, 2] as const;
/** Slider range, relative to the estimate. */
export const PORTION_RANGE = { min: 0.25, max: 2.5, step: 0.05 } as const;

export interface ReviewItem {
  item: MealItem;
  /** The analyser's estimate in grams; portion factors are relative to it. */
  estimate: number;
  factor: number;
  macros: Macros;
}

/**
 * Editable copy of a meal's components (a photo's breakdown, a scanned product or a logged meal):
 * each portion can be slid or snapped to a preset, removed, and the meal renamed or moved to
 * another slot. Totals are recomputed with the same pure function the
 * server uses to store them.
 */
export function useMealReview(draft: MealDraft, initialSlot: MealSlot) {
  const [name, setName] = useState(draft.name);
  const [slot, setSlot] = useState<MealSlot>(initialSlot);
  const [factors, setFactors] = useState(() => draft.items.map(() => 1));
  const [removed, setRemoved] = useState<Set<number>>(() => new Set());

  const rows = useMemo(
    () =>
      draft.items.flatMap((item, i): (ReviewItem & { index: number })[] => {
        if (removed.has(i)) return [];
        const grams = Math.max(1, Math.round(item.grams * factors[i]));
        const scaled = { ...item, grams };
        return [{ index: i, item: scaled, estimate: item.grams, factor: factors[i], macros: roundMacros(itemMacros(scaled)) }];
      }),
    [draft.items, factors, removed],
  );

  const totals = useMemo(() => totalOfItems(rows.map((r) => r.item)), [rows]);
  const valid = name.trim().length > 0 && rows.length > 0;

  return {
    name,
    setName,
    slot,
    setSlot,
    rows,
    totals,
    valid,
    removedCount: removed.size,
    setFactor: (index: number, factor: number) =>
      setFactors((f) => f.map((v, i) => (i === index ? Math.min(PORTION_RANGE.max, Math.max(PORTION_RANGE.min, factor)) : v))),
    remove: (index: number) => setRemoved((r) => new Set(r).add(index)),
    restoreAll: () => setRemoved(new Set()),
    toMeal: (): CreateMealInput => ({ name: name.trim(), slot, items: rows.map((r) => r.item) }),
  };
}
