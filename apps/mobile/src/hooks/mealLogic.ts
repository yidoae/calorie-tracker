import { dayKey } from "@calorie/core/dates";
import { itemMacros, parseGrams, roundMacros, sumMacros, totalOfItems } from "@calorie/core/nutrition/macros";
import { MEAL_SLOTS, type LogMealPayload, type Meal, type MealSlot } from "@calorie/core/schemas/meal";
import type { Macros } from "@calorie/core/schemas/nutrition";
import type { FoodHit } from "@calorie/core/schemas/rows";

/*
 * Pure logic behind logging a meal (US3): the draft the review step edits, the log_meal payload
 * built from it, and the dashboard's day summary. No React Native imports, so
 * tests/mealLogic.test.ts runs this under node. Numbers shown before saving are a preview from
 * the per-100 g values; the saved totals come from the database (FR-015).
 */

/** One food in the draft; the gram field starts empty and is kept as typed (FR-013). */
export interface DraftItem {
  key: string;
  food: FoodHit;
  gramsText: string;
}

/** The meal being put together: `slot` stays null until the user picks one (FR-014). */
export interface MealDraft {
  slot: MealSlot | null;
  items: DraftItem[];
  nextKey: number;
}

export const EMPTY_DRAFT: MealDraft = { slot: null, items: [], nextKey: 1 };

/** Most items in one meal; log_meal refuses more. */
export const MAX_DRAFT_ITEMS = 30;

export function addFood(draft: MealDraft, food: FoodHit): MealDraft {
  if (draft.items.length >= MAX_DRAFT_ITEMS) return draft;
  return { ...draft, items: [...draft.items, { key: `item-${draft.nextKey}`, food, gramsText: "" }], nextKey: draft.nextKey + 1 };
}

export function setDraftGrams(draft: MealDraft, key: string, gramsText: string): MealDraft {
  return { ...draft, items: draft.items.map((item) => (item.key === key ? { ...item, gramsText } : item)) };
}

export function removeDraftItem(draft: MealDraft, key: string): MealDraft {
  return { ...draft, items: draft.items.filter((item) => item.key !== key) };
}

export function setDraftSlot(draft: MealDraft, slot: MealSlot): MealDraft {
  return { ...draft, slot };
}

/** Why the typed grams cannot be saved, or null: more than 0 and at most 5000 g (FR-013). */
export function gramsError(text: string): string | null {
  if (text.trim() === "") return "Kaç gram yediğini yaz.";
  return parseGrams(text) === null ? "Gramı 0'dan büyük, en fazla 5.000 olarak yaz." : null;
}

/** One item's nutrition at the typed grams, rounded for display; null while the grams are not valid. */
export function draftItemMacros(item: DraftItem): Macros | null {
  const grams = parseGrams(item.gramsText);
  return grams === null ? null : roundMacros(itemMacros({ grams, per100g: item.food.per100g }));
}

/** Live totals of the items whose grams are valid, rounded for display. */
export function draftTotals(draft: MealDraft): Macros {
  return totalOfItems(
    draft.items.flatMap((item) => {
      const grams = parseGrams(item.gramsText);
      return grams === null ? [] : [{ grams, per100g: item.food.per100g }];
    }),
  );
}

export function draftReady(draft: MealDraft): boolean {
  return draft.items.length > 0 && draft.items.every((item) => parseGrams(item.gramsText) !== null);
}

const MAX_NAME = 80;

/** A meal name from its foods: "Yoğurt, iskender, ayran …", at most 80 characters. */
export function mealNameFor(names: readonly string[]): string {
  const listed = names.slice(0, 3).map((name, i) => (i === 0 ? name : name.toLocaleLowerCase("tr-TR")));
  const name = listed.join(", ") + (names.length > 3 ? " …" : "");
  return name.length <= MAX_NAME ? name : `${name.slice(0, MAX_NAME - 2).trimEnd()} …`;
}

/** The day and time zone a meal is logged in (FR-016). */
export interface LocalDay {
  localDate: string;
  timeZone: string;
}

/** The log_meal payload: foods and grams only, never nutrition (FR-015); null until the draft is ready. */
export function logMealPayload(draft: MealDraft, defaultSlot: MealSlot, day: LocalDay): LogMealPayload | null {
  if (!draftReady(draft)) return null;
  return {
    slot: draft.slot ?? defaultSlot,
    localDate: day.localDate,
    timeZone: day.timeZone,
    name: mealNameFor(draft.items.map((item) => item.food.name)),
    items: draft.items.map((item) => ({ foodId: item.food.foodId, grams: parseGrams(item.gramsText) as number })),
  };
}

/** What the user ate on a day: the sum of the meals' server-computed totals. */
export function dayTotals(meals: readonly Meal[]): Macros {
  return sumMacros(meals.map((meal) => meal.totals));
}

export interface SlotGroup {
  slot: MealSlot;
  meals: Meal[];
  calories: number;
}

/** The day's meals under their slots, in the order of the day; empty slots are left out (FR-018). */
export function groupBySlot(meals: readonly Meal[]): SlotGroup[] {
  return MEAL_SLOTS.flatMap((slot) => {
    const inSlot = meals.filter((meal) => meal.slot === slot).sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
    return inSlot.length === 0 ? [] : [{ slot, meals: inSlot, calories: sumMacros(inSlot.map((meal) => meal.totals)).calories }];
  });
}

/** `YYYY-MM-DD` of `now` in `timeZone`; the device's own day when Intl does not know the zone. */
export function localDayKey(now: Date, timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
    const part = (type: string) => parts.find((p) => p.type === type)?.value;
    const [year, month, day] = [part("year"), part("month"), part("day")];
    return year && month && day ? `${year}-${month}-${day}` : dayKey(now);
  } catch {
    return dayKey(now);
  }
}

/** Milliseconds until a second after the device's next midnight, when "today" moves on. */
export function msUntilNextDay(now: Date): number {
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return midnight.getTime() - now.getTime() + 1000;
}
