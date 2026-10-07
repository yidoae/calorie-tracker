"use client";

import { useMemo, useState } from "react";
import { itemMacros, parseGrams, roundMacros, totalOfItems } from "@/lib/nutrition/macros";
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
  /** What's in the gram field (typed, or set by the slider/presets). */
  gramText: string;
  /** True while the gram field is empty or invalid; the meal can't be saved then. */
  missing: boolean;
}

const asText = (grams: number) => String(Math.max(1, Math.round(grams)));

/**
 * Editable copy of a meal's components (a photo's breakdown, a scanned product or a logged meal):
 * each portion can be typed in grams, slid or snapped to a preset, removed, and the meal renamed or
 * moved to another slot. With `askGrams` (a scanned product: we don't know how much was eaten) the
 * gram fields start empty and must be filled. Totals are recomputed with the same pure function the
 * server uses to store them.
 */
export function useMealReview(draft: MealDraft, initialSlot: MealSlot, { askGrams = false }: { askGrams?: boolean } = {}) {
  const [name, setName] = useState(draft.name);
  const [slot, setSlot] = useState<MealSlot>(initialSlot);
  const [gramTexts, setGramTexts] = useState(() => draft.items.map((item) => (askGrams ? "" : asText(item.grams))));
  const [removed, setRemoved] = useState<Set<number>>(() => new Set());

  const rows = useMemo(
    () =>
      draft.items.flatMap((item, i): (ReviewItem & { index: number })[] => {
        if (removed.has(i)) return [];
        const grams = parseGrams(gramTexts[i]);
        const scaled = { ...item, grams: grams ?? 0 };
        return [
          {
            index: i,
            item: scaled,
            estimate: item.grams,
            factor: grams === null ? 0 : grams / item.grams,
            macros: roundMacros(itemMacros(scaled)),
            gramText: gramTexts[i],
            missing: grams === null,
          },
        ];
      }),
    [draft.items, gramTexts, removed],
  );

  const totals = useMemo(() => totalOfItems(rows.map((r) => r.item)), [rows]);
  const valid = name.trim().length > 0 && rows.length > 0 && rows.every((r) => !r.missing);

  const setText = (index: number, text: string) => setGramTexts((t) => t.map((v, i) => (i === index ? text : v)));

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
      setText(index, asText(draft.items[index].grams * Math.min(PORTION_RANGE.max, Math.max(PORTION_RANGE.min, factor)))),
    setGrams: (index: number, text: string) => setText(index, text.replace(/[^\d.,]/g, "").slice(0, 6)),
    remove: (index: number) => setRemoved((r) => new Set(r).add(index)),
    restoreAll: () => setRemoved(new Set()),
    toMeal: (): CreateMealInput => ({ name: name.trim(), slot, items: rows.map((r) => r.item) }),
  };
}
