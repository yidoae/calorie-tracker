/*
 * Shapes of the pipeline's source records (data-model.md "Pipeline sources"). These check structure
 * only; the domain rules (ranges, uniqueness, brands, recipes) live in rules.ts so one build reports
 * every problem at once instead of stopping at the first parse error.
 */
import { z } from "@calorie/core/schemas/zod";

const CATEGORIES = [
  "meat", "poultry", "fish", "egg", "dairy", "legume", "grain", "bread", "vegetable", "fruit",
  "nut_seed", "oil", "sweet", "drink", "alcohol", "dish", "other",
] as const;

const portion = z.object({ unit: z.string(), grams: z.number() });

const base = {
  id: z.string(),
  name: z.string(),
  category: z.enum(CATEGORIES),
  aliases: z.array(z.string()),
  typicalPortionG: z.number(),
  portions: z.array(portion).default([]),
  /** Why this food's energy may sit outside the 4/4/9/7 check (shown in the review). */
  energyException: z.string().min(10).optional(),
};

export const usdaFoodSchema = z.object({ ...base, fdcId: z.number().int() });

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const labelFoodSchema = z.object({
  ...base,
  label: z.object({
    brand: z.string(),
    product: z.string(),
    date,
    kcal: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),
    alcohol: z.number().default(0),
  }),
});

export const recipeSchema = z.object({
  ...base,
  ingredients: z.array(z.object({ foodId: z.string(), grams: z.number() })),
  waterG: z.number().default(0),
  yield: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("weighed"), grams: z.number(), date }),
    // The moisture change is read from the USDA extract, so it has one source of truth.
    z.object({ kind: z.literal("fndds"), foodCode: z.number().int() }),
    z.object({ kind: z.literal("usda_meat_yield"), table: z.string(), yieldPct: z.number() }),
  ]),
});

export const withdrawnSchema = z.object({ id: z.string(), reason: z.string() });

export const searchCaseSchema = z.object({ query: z.string(), expectedId: z.string() });

const per100 = { kcal: z.number(), protein: z.number(), carbs: z.number(), fat: z.number(), alcohol: z.number() };

export const usdaExtractSchema = z.object({
  release: z.string(),
  foods: z.record(
    z.string(),
    z.object({ description: z.string(), dataType: z.string(), kcalNutrient: z.enum(["1008", "2047", "2048"]), ...per100 }),
  ),
  /** FNDDS food code → the moisture change of its recipe (food_attribute type 1002). */
  fnddsMoisture: z.record(z.string(), z.object({ fdcId: z.number().int(), description: z.string(), moisturePct: z.number() })),
});

export const usdaReleaseSchema = z.object({
  release: z.string(),
  files: z.array(z.object({ name: z.string(), url: z.url(), sha256: z.string().regex(/^[0-9a-f]{64}$/) })),
});

export type Portion = z.output<typeof portion>;
export type UsdaExtract = z.output<typeof usdaExtractSchema>;
export type SearchCase = z.output<typeof searchCaseSchema>;
export type Category = (typeof CATEGORIES)[number];
