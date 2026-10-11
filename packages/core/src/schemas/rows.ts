import { dayKeySchema, mealSchema, mealSlotSchema, type Meal } from "./meal.ts";
import { DIET_STYLES, nutritionPlanSchema, planInputsSchema, type NutritionPlan } from "./plan.ts";
import { ACTIVITY_LEVEL_KEYS, GENDERS } from "./profile.ts";
import { z } from "./zod.ts";

/*
 * Database rows (snake_case, as PostgREST returns them) mapped to the objects the app uses
 * (camelCase). Every read in the app goes through one of these schemas (constitution II).
 * Postgres numeric columns may arrive as strings, so numbers are coerced.
 */

const num = z.coerce.number<number | string>();
const numOrNull = z.union([z.null(), num]);

/** The account's profile; most fields stay null until the first-time setup fills them. */
export const profileRowSchema = z
  .object({
    id: z.uuid(),
    sex: z.enum(GENDERS).nullable(),
    birth_year: z.number().int().nullable(),
    height_cm: numOrNull,
    weight_kg: numOrNull,
    goal_weight_kg: numOrNull,
    activity_level: z.enum(ACTIVITY_LEVEL_KEYS).nullable(),
    diet_style: z.enum(DIET_STYLES).nullable(),
    fat_per_kg: num,
    time_zone: z.string().nullable(),
    onboarding_completed: z.boolean(),
    sensitive_warning_ack: z.boolean(),
  })
  .transform((r) => ({
    id: r.id,
    sex: r.sex,
    birthYear: r.birth_year,
    heightCm: r.height_cm,
    weightKg: r.weight_kg,
    goalWeightKg: r.goal_weight_kg,
    activityLevel: r.activity_level,
    dietStyle: r.diet_style,
    fatPerKg: r.fat_per_kg,
    timeZone: r.time_zone,
    onboardingCompleted: r.onboarding_completed,
    sensitiveWarningAck: r.sensitive_warning_ack,
  }));
export type Profile = z.output<typeof profileRowSchema>;

/** An active (or past) plan row; `base_*` are always set, `training_*` / `rest_*` only when cycling. */
export const planRowSchema = z
  .object({
    id: z.uuid(),
    created_at: z.string(),
    inputs: planInputsSchema,
    bmr: num,
    tdee: num,
    summary: z.string(),
    base_kcal: num,
    base_protein_g: num,
    base_carbs_g: num,
    base_fat_g: num,
    training_kcal: numOrNull,
    training_protein_g: numOrNull,
    training_carbs_g: numOrNull,
    training_fat_g: numOrNull,
    rest_kcal: numOrNull,
    rest_protein_g: numOrNull,
    rest_carbs_g: numOrNull,
    rest_fat_g: numOrNull,
  })
  .transform((r): NutritionPlan => {
    const cycling = r.training_kcal !== null && r.rest_kcal !== null;
    return nutritionPlanSchema.parse({
      id: r.id,
      createdAt: r.created_at,
      inputs: r.inputs,
      bmr: r.bmr,
      tdee: r.tdee,
      base: { calories: r.base_kcal, protein: r.base_protein_g, carbs: r.base_carbs_g, fat: r.base_fat_g },
      cycle: cycling
        ? {
            training: { calories: r.training_kcal, protein: r.training_protein_g ?? 0, carbs: r.training_carbs_g ?? 0, fat: r.training_fat_g ?? 0 },
            rest: { calories: r.rest_kcal, protein: r.rest_protein_g ?? 0, carbs: r.rest_carbs_g ?? 0, fat: r.rest_fat_g ?? 0 },
          }
        : null,
      strategySummary: r.summary,
    });
  });

const mealItemRowSchema = z.object({
  id: z.uuid(),
  food_id: z.string(),
  grams: num,
  kcal_per_100g: num,
  protein_per_100g: num,
  carbs_per_100g: num,
  fat_per_100g: num,
  position: z.number().int(),
  foods: z.object({ name_tr: z.string() }),
});

/** A meal with its items (`meals` + `meal_items(*, foods(name_tr))`), items in position order. */
export const mealRowSchema = z
  .object({
    id: z.uuid(),
    slot: mealSlotSchema,
    local_date: z.string(),
    time_zone: z.string(),
    logged_at: z.string(),
    name: z.string(),
    total_kcal: num,
    total_protein_g: num,
    total_carbs_g: num,
    total_fat_g: num,
    meal_items: z.array(mealItemRowSchema),
  })
  .transform(
    (r): Meal =>
      mealSchema.parse({
        id: r.id,
        slot: r.slot,
        localDate: r.local_date,
        timeZone: r.time_zone,
        loggedAt: r.logged_at,
        name: r.name,
        totals: { calories: r.total_kcal, protein: r.total_protein_g, carbs: r.total_carbs_g, fat: r.total_fat_g },
        items: [...r.meal_items]
          .sort((a, b) => a.position - b.position)
          .map((i) => ({
            id: i.id,
            position: i.position,
            foodId: i.food_id,
            name: i.foods.name_tr,
            grams: i.grams,
            per100g: { calories: i.kcal_per_100g, protein: i.protein_per_100g, carbs: i.carbs_per_100g, fat: i.fat_per_100g },
          })),
      }),
  );

/** The meal `log_meal` returns: the row without its items, with the totals the database computed. */
export const loggedMealRowSchema = z
  .object({
    id: z.uuid(),
    slot: mealSlotSchema,
    local_date: dayKeySchema,
    total_kcal: num,
    total_protein_g: num,
    total_carbs_g: num,
    total_fat_g: num,
  })
  .transform((r) => ({
    id: r.id,
    slot: r.slot,
    localDate: r.local_date,
    totals: { calories: r.total_kcal, protein: r.total_protein_g, carbs: r.total_carbs_g, fat: r.total_fat_g },
  }));
export type LoggedMeal = z.output<typeof loggedMealRowSchema>;

/** One `search_foods` result: the food, the alias that matched and its values per 100 g. */
export const foodHitRowSchema = z
  .object({
    food_id: z.string(),
    name_tr: z.string(),
    matched_alias: z.string(),
    typical_portion_g: num,
    kcal_per_100g: num,
    protein_per_100g: num,
    carbs_per_100g: num,
    fat_per_100g: num,
  })
  .transform((r) => ({
    foodId: r.food_id,
    name: r.name_tr,
    matchedAlias: r.matched_alias,
    typicalPortionG: r.typical_portion_g,
    per100g: { calories: r.kcal_per_100g, protein: r.protein_per_100g, carbs: r.carbs_per_100g, fat: r.fat_per_100g },
  }));
export type FoodHit = z.output<typeof foodHitRowSchema>;
