/*
 * The build rules (data-model.md "Build rules"). checkFoods returns every failure, each starting with
 * the food id(s) it is about, so one build run shows the whole list of fixes.
 */
import { normalizeTr } from "@calorie/core/search/normalize";
import type { Per100 } from "./recipe.ts";
import type { Category, Portion } from "./schemas.ts";

export interface ResolvedFood {
  id: string;
  name: string;
  category: Category;
  sourceKind: "usda" | "recipe" | "label";
  sourceRef: string;
  per100: Per100;
  typicalPortionG: number;
  portions: Portion[];
  aliases: string[];
  /** Label foods: the brand, kept out of the name and aliases. */
  brand?: string;
  /** A reviewed reason to skip the energy check (USDA values that 4/4/9/7 cannot reproduce). */
  energyException?: string;
  recipe?: { ingredients: { foodId: string; grams: number }[]; waterG: number; cookedG: number };
}

export interface RuleContext {
  /** Ids of the 001 foods; saved meals point at them (FR-006). */
  legacyIds: string[];
  minFoods: number;
  minDishes: number;
}

const ID = /^[a-z0-9_]{1,64}$/;
const MAX_GRAMS = 5000;
// USDA computes energy with food-specific Atwater factors and counts fibre in carbohydrate, so plain
// 4/4/9/7 overshoots vegetables by up to ~20 %. The rule is there to catch typos, not rounding.
const ENERGY_TOLERANCE = 0.2;
const ENERGY_MIN_DIFF_KCAL = 10;
// Below this, label and USDA rounding outweighs the macros (tea, coffee, water).
const ENERGY_EXEMPT_KCAL = 20;
const RANGES: Record<keyof Per100, number> = { kcal: 900, protein: 100, carbs: 100, fat: 100, alcohol: 100 };
const COOKED_MARKER = /\((pişmiş|haşlanmış|kızarmış|ızgara)[^)]*\)/i;
const RAW_MARKER = /\((çiğ|kuru)[^)]*\)/i;

const words = (text: string) => normalizeTr(text).split(" ").filter(Boolean);
const baseName = (name: string) => normalizeTr(name.replace(/\(.*?\)/g, ""));

export function checkFoods(foods: ResolvedFood[], ctx: RuleContext): string[] {
  const errors: string[] = [];
  const byId = new Map<string, ResolvedFood>();
  const aliasOwner = new Map<string, string>();
  const rawBases = new Set(foods.filter((f) => RAW_MARKER.test(f.name)).map((f) => baseName(f.name)));

  for (const f of foods) {
    const fail = (msg: string) => errors.push(`${f.id}: ${msg}`);

    if (byId.has(f.id)) fail("duplicate id");
    byId.set(f.id, f);
    if (!ID.test(f.id)) fail(`id must match ${ID}`);
    if (f.name.length < 1 || f.name.length > 80) fail(`name must be 1–80 characters (${f.name.length})`);

    if (f.aliases.length === 0) fail("needs at least one alias");
    for (const alias of f.aliases) {
      const key = normalizeTr(alias);
      if (alias.length < 1 || alias.length > 60) fail(`alias "${alias}" must be 1–60 characters`);
      const owner = aliasOwner.get(key);
      if (owner !== undefined && owner !== f.id) errors.push(`${owner}, ${f.id}: share the alias "${key}"`);
      aliasOwner.set(key, f.id);
      if (COOKED_MARKER.test(f.name) && rawBases.has(key)) fail(`owns the bare staple alias "${alias}"; it belongs to the raw/dry food (FR-005)`);
    }

    if (f.brand) {
      const brandWords = words(f.brand);
      for (const text of [f.name, ...f.aliases]) {
        if (words(text).some((w) => brandWords.includes(w))) fail(`"${text}" contains the brand "${f.brand}"`);
      }
    }

    for (const [key, max] of Object.entries(RANGES) as [keyof Per100, number][]) {
      const v = f.per100[key];
      if (!(v >= 0 && v <= max)) fail(`${key} per 100 g must be 0–${max} (${v})`);
    }
    const { kcal, protein, carbs, fat, alcohol } = f.per100;
    const expected = 4 * protein + 4 * carbs + 9 * fat + 7 * alcohol;
    if (!f.energyException && kcal >= ENERGY_EXEMPT_KCAL && Math.abs(kcal - expected) > Math.max(ENERGY_TOLERANCE * kcal, ENERGY_MIN_DIFF_KCAL)) {
      fail(`energy ${kcal} kcal is more than 20 % (or 10 kcal) off 4P + 4C + 9F + 7A = ${expected.toFixed(1)} kcal`);
    }

    if (!(f.typicalPortionG > 0 && f.typicalPortionG <= MAX_GRAMS)) fail(`typical portion must be 0–${MAX_GRAMS} g (${f.typicalPortionG})`);
    const units = new Set<string>();
    for (const p of f.portions) {
      if (units.has(p.unit)) fail(`portion unit "${p.unit}" appears twice`);
      units.add(p.unit);
      if (p.unit.length < 1 || p.unit.length > 30) fail(`portion unit "${p.unit}" must be 1–30 characters`);
      if (!(p.grams > 0 && p.grams <= MAX_GRAMS)) fail(`portion "${p.unit}" must be 0–${MAX_GRAMS} g (${p.grams})`);
    }
  }

  // Recipes need the whole list first: their ingredients may come later in the sources.
  for (const f of foods) {
    if (!f.recipe) continue;
    const { ingredients, waterG, cookedG } = f.recipe;
    for (const i of ingredients) {
      const ingredient = byId.get(i.foodId);
      if (!ingredient) errors.push(`${f.id}: ingredient "${i.foodId}" is not in the list`);
      else if (ingredient.sourceKind === "recipe") errors.push(`${f.id}: ingredient "${i.foodId}" is itself a recipe; use its raw ingredients`);
    }
    const pot = ingredients.reduce((sum, i) => sum + i.grams, 0) + waterG;
    if (!(cookedG > 0 && cookedG <= pot)) errors.push(`${f.id}: cooked weight ${cookedG} g must be above 0 and at most ingredients + water (${pot} g)`);
  }

  for (const id of ctx.legacyIds) if (!byId.has(id)) errors.push(`${id}: 001 food missing from the list (saved meals point at it)`);

  const dishes = foods.filter((f) => f.category === "dish").length;
  if (foods.length < ctx.minFoods) errors.push(`list: ${foods.length} foods, need at least ${ctx.minFoods}`);
  if (dishes < ctx.minDishes) errors.push(`list: ${dishes} dishes, need at least ${ctx.minDishes}`);

  return errors;
}
