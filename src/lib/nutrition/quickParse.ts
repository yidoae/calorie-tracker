import type { MealSlot, QuickParseResult } from "@/types/meal";
import { SLOT_LABELS } from "../labels";
import type { MealItem } from "@/types/nutrition";
import { FOODS, foodItem, type Food, type FoodUnit } from "./foods";

/*
 * Quick-entry parser: turns free Turkish text such as
 *   "Öğlen 200g ızgara tavuk, bol salata ve 1 dilim tam buğday ekmeği"
 * into meal items using the food database. Pure and deterministic, so the client runs it on
 * every keystroke for an instant preview; the server runs the same code and asks the local
 * LLM only about the fragments this parser couldn't match (server/food/aiMatch.ts).
 */

type UnitKind = FoodUnit | "g" | "porsiyon" | "tabak";

/** Unit words, longest phrases first. Values are the unit and a multiplier to that unit. */
const UNIT_WORDS: [string[], UnitKind, number][] = [
  [["yemek", "kaşığı"], "yemekKasigi", 1],
  [["çay", "kaşığı"], "cayKasigi", 1],
  [["tatlı", "kaşığı"], "cayKasigi", 1],
  [["su", "bardağı"], "bardak", 1],
  [["kg"], "g", 1000],
  [["kilo"], "g", 1000],
  [["g"], "g", 1],
  [["gr"], "g", 1],
  [["gram"], "g", 1],
  [["gramlık"], "g", 1],
  [["ml"], "g", 1],
  [["adet"], "adet", 1],
  [["tane"], "adet", 1],
  [["dilim"], "dilim", 1],
  [["kase"], "kase", 1],
  [["kâse"], "kase", 1],
  [["tas"], "kase", 1],
  [["bardak"], "bardak", 1],
  [["kaşık"], "yemekKasigi", 1],
  [["avuç"], "avuc", 1],
  [["kutu"], "kutu", 1],
  [["ölçek"], "olcek", 1],
  [["scoop"], "olcek", 1],
  [["porsiyon"], "porsiyon", 1],
  [["tabak"], "tabak", 1],
];

/** Grams per unit when the food doesn't define its own. */
const DEFAULT_UNIT_GRAMS: Record<FoodUnit, number | null> = {
  adet: null, // falls back to the food's portion
  dilim: 30,
  kase: 200,
  bardak: 200,
  yemekKasigi: 15,
  cayKasigi: 5,
  avuc: 30,
  kutu: 150,
  olcek: 30,
};

const NUMBER_WORDS: Record<string, number> = {
  yarım: 0.5, çeyrek: 0.25, bir: 1, iki: 2, üç: 3, dört: 4, beş: 5, altı: 6, yedi: 7, sekiz: 8, dokuz: 9, on: 10,
};

/** Size words scale the portion. */
const MODIFIERS: Record<string, number> = {
  bol: 1.5, kocaman: 1.5, büyük: 1.3, çift: 2, duble: 2, az: 0.5, biraz: 0.5, küçük: 0.7,
};

const MEAL_SLOTS: [string, MealSlot][] = [
  ["kahvaltı", "breakfast"],
  ["sabah", "breakfast"],
  ["öğle", "lunch"],
  ["akşam", "dinner"],
  ["ara", "snack"],
  ["atıştırma", "snack"],
];

/** Filler words that are fine to leave unmatched. */
const STOPWORDS = new Set([
  "de", "da", "ve", "ile", "bir", "biraz", "kadar", "yaklaşık", "falan", "gibi", "yedim", "içtim", "yemeği", "yemek",
  "öğün", "öğünü", "yanında", "üstüne", "ekstra", "bi", "tane", "civarı", "civarında", "ızgara", "haşlanmış",
]);

const NUMBER_RE = /^(\d+(?:[.,]\d+)?)([a-zğüşıöç]*)$/;

export function normalizeText(text: string): string {
  return text
    .toLocaleLowerCase("tr-TR")
    .replace(/[^\p{L}\p{N}.,+\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Turkish suffixes change word endings ("ekmek" → "ekmeği", "tavuk" → "tavuklu"), so a text word
 * matches an alias word if it starts with the alias minus its last letter. Very short aliases
 * ("et") must match exactly or with a short suffix.
 */
function wordMatches(word: string, alias: string): boolean {
  if (word === alias) return true;
  if (alias.length <= 3) return word.startsWith(alias) && word.length <= alias.length + 2;
  return word.startsWith(alias.slice(0, -1)) && word.length <= alias.length + 5;
}

const ALIASES = FOODS.flatMap((food) => food.aliases.map((alias) => ({ food: food as Food, words: alias.split(" "), weight: alias.length })));

interface Match {
  food: Food;
  start: number;
  end: number; // exclusive
}

/** The longest alias found among unused words, or null. */
function bestMatch(words: string[], used: boolean[]): Match | null {
  let best: (Match & { weight: number }) | null = null;
  for (const { food, words: aliasWords, weight } of ALIASES) {
    for (let i = 0; i + aliasWords.length <= words.length; i++) {
      const fits = aliasWords.every((a, k) => !used[i + k] && wordMatches(words[i + k], a));
      if (fits && (!best || weight > best.weight)) best = { food, start: i, end: i + aliasWords.length, weight };
    }
  }
  return best;
}

interface Quantity {
  count: number;
  unit: UnitKind | null;
  index: number;
}

function parseNumber(word: string): { value: number; suffix: string } | null {
  const m = NUMBER_RE.exec(word);
  if (m) return { value: Number(m[1].replace(",", ".")), suffix: m[2] };
  if (word in NUMBER_WORDS) return { value: NUMBER_WORDS[word], suffix: "" };
  return null;
}

/** Unit phrase starting at `i`, if any: [unit, multiplier, words consumed]. */
function unitAt(words: string[], i: number): [UnitKind, number, number] | null {
  for (const [phrase, unit, mult] of UNIT_WORDS) {
    if (phrase.every((p, k) => words[i + k] !== undefined && wordMatches(words[i + k], p))) return [unit, mult, phrase.length];
  }
  return null;
}

/** Quantities in a segment ("200g", "1 dilim", "iki yemek kaşığı"); marks consumed words as used. */
function findQuantities(words: string[], used: boolean[]): Quantity[] {
  const found: Quantity[] = [];
  for (let i = 0; i < words.length; i++) {
    if (used[i]) continue;
    const num = parseNumber(words[i]);
    if (!num || !Number.isFinite(num.value) || num.value <= 0) continue;
    // "bir" is also the indefinite article; only treat it as a number when a unit follows.
    const attached = num.suffix ? unitAt([num.suffix], 0) : null;
    const following = attached ? null : unitAt(words, i + 1);
    if (words[i] === "bir" && !following) continue;
    if (num.suffix && !attached) continue; // "3lü" etc.
    used[i] = true;
    if (following) for (let k = 1; k <= following[2]; k++) used[i + k] = true;
    const unit = attached ?? following;
    found.push({ count: num.value * (unit?.[1] ?? 1), unit: unit?.[0] ?? null, index: i });
  }
  // A unit with no number ("kase yoğurt", "dilim ekmek") means one of it.
  for (let i = 0; i < words.length; i++) {
    if (used[i]) continue;
    const unit = unitAt(words, i);
    if (!unit || unit[0] === "g") continue;
    for (let k = 0; k < unit[2]; k++) used[i + k] = true;
    found.push({ count: 1, unit: unit[0], index: i });
  }
  return found;
}

function gramsFor(food: Food, q: Quantity | null, modifier: number): number {
  if (!q) return food.portion * modifier;
  switch (q.unit) {
    case "g":
      return q.count;
    case "porsiyon":
      return q.count * food.portion * modifier;
    case "tabak":
      return q.count * food.portion * 1.2 * modifier;
    case null:
      return q.count * (food.units?.adet ?? food.portion) * modifier;
    default:
      return q.count * (food.units?.[q.unit] ?? DEFAULT_UNIT_GRAMS[q.unit] ?? food.portion) * modifier;
  }
}

/** Splits on commas (not decimal commas), "+", ";" and the words "ve", "ile", "artı", "yanında". */
function segments(text: string): string[] {
  return text
    .split(/(?<!\d),|,(?!\d)|;|\+|\s(?:ve|ile|artı|yanında)\s/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function mealSlot(words: string[]): MealSlot | null {
  for (const [stem, slot] of MEAL_SLOTS) {
    if (words.some((w) => w.startsWith(stem) && !(stem === "ara" && w !== "ara"))) return slot;
  }
  return null;
}

const MAX_GRAMS = 3000;

export interface ParsedFood {
  foodId: string;
  grams: number;
}

/** Items recognised in `text`, the fragments that weren't, and a meal slot word if one was used. */
export function parseMealText(text: string): { foods: ParsedFood[]; unmatched: string[]; slot: MealSlot | null } {
  const normalized = normalizeText(text);
  const foods: ParsedFood[] = [];
  const unmatched: string[] = [];
  const slot = mealSlot(normalized.split(" "));

  for (const segment of segments(normalized)) {
    const words = segment.split(" ").filter(Boolean);
    const used = words.map(() => false);
    // Meal-slot words ("öğlen", "akşam yemeği") aren't food.
    words.forEach((w, i) => {
      if (MEAL_SLOTS.some(([stem]) => w.startsWith(stem) && !(stem === "ara" && w !== "ara"))) used[i] = true;
    });

    const quantities = findQuantities(words, used);
    let modifier = 1;
    words.forEach((w, i) => {
      if (!used[i] && w in MODIFIERS) {
        modifier *= MODIFIERS[w];
        used[i] = true;
      }
    });

    const matches: Match[] = [];
    for (let m = bestMatch(words, used); m; m = bestMatch(words, used)) {
      for (let i = m.start; i < m.end; i++) used[i] = true;
      matches.push(m);
    }
    matches.sort((a, b) => a.start - b.start);

    if (matches.length === 0) {
      const meaningful = words.filter((w, i) => !used[i] && !STOPWORDS.has(w) && w.length >= 2);
      if (meaningful.length > 0) unmatched.push(segment);
      continue;
    }

    // A quantity belongs to the food right after it ("2 dilim ekmek"); the last food may also take
    // one written after it ("tavuk 200 g").
    quantities.sort((a, b) => a.index - b.index);
    const taken = new Set<Quantity>();
    let prevEnd = 0;
    matches.forEach((match, k) => {
      const last = k === matches.length - 1;
      const q =
        quantities.find((x) => !taken.has(x) && x.index >= prevEnd && x.index < match.start) ??
        (last ? quantities.find((x) => !taken.has(x) && x.index >= match.end) : undefined) ??
        null;
      if (q) taken.add(q);
      const grams = Math.min(MAX_GRAMS, Math.max(1, gramsFor(match.food, q, modifier)));
      foods.push({ foodId: match.food.id, grams: Math.round(grams) });
      modifier = 1; // size words apply to the first food of the segment only
      prevEnd = match.end;
    });
  }
  return { foods, unmatched, slot };
}

/** A meal name for parsed items: the slot ("Öğle yemeği") or the first few item names. */
export function mealName(slot: MealSlot | null, items: Pick<MealItem, "name">[]): string {
  if (slot) return SLOT_LABELS[slot];
  const names = items.slice(0, 3).map((i, k) => (k === 0 ? i.name : i.name.toLocaleLowerCase("tr-TR")));
  return names.join(", ") + (items.length > 3 ? " …" : "");
}

/** Full client-side parse into meal items. */
export function quickParse(text: string, lookup: (id: string) => Food | undefined): QuickParseResult {
  const { foods, unmatched, slot } = parseMealText(text);
  const items = foods.flatMap(({ foodId, grams }) => {
    const food = lookup(foodId);
    return food ? [foodItem(food, grams)] : [];
  });
  return { name: mealName(slot, items), slot, items, unmatched, aiMatched: [] };
}
