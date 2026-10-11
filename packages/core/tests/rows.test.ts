import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Database, Json } from "../src/db/database.types.ts";
import { buildPlan } from "../src/nutrition/plan.ts";
import { logMealPayloadSchema } from "../src/schemas/meal.ts";
import type { PlanInputs } from "../src/schemas/plan.ts";
import { foodHitRowSchema, loggedMealRowSchema, mealRowSchema, planRowSchema, profileRowSchema } from "../src/schemas/rows.ts";
import type { z } from "../src/schemas/zod.ts";

const MEAL_ID = "6f1c2c47-5d7e-4c7b-9b3e-1f2a3b4c5d6e";
const inputs: PlanInputs = {
  sex: "male",
  heightCm: 180,
  weightKg: 90,
  age: 30,
  targetWeightKg: 80,
  goal: "cut",
  intensity: 500,
  trainingStyle: "strength",
  split: "upperLower",
  trainingDays: [0, 1, 3, 4],
  dietStyle: "highProtein",
  fatPerKg: 1.2,
  mealPattern: "classic",
  fastingWindowStart: 12,
  cycling: false,
};

type Row<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
/**
 * Columns a row schema reads that the table lacks, and nullable columns it does not accept null for
 * (`Json` contains null by itself, so json columns are left out of the null check).
 */
type Drift<In, R> =
  | Exclude<keyof In, keyof R>
  | { [K in keyof In & keyof R]: Json extends R[K] ? never : null extends R[K] ? (null extends In[K] ? never : K) : never }[keyof In & keyof R];
/** Compiles with no argument only when there is no drift; otherwise the expected argument names it. */
const noDrift = <In, R>(...drift: [Drift<In, R>] extends [never] ? [] : [Drift<In, R>]) => drift.length === 0;

describe("database rows", () => {
  it("reads only columns of the generated database types, with their nullability", () => {
    type MealIn = z.input<typeof mealRowSchema>;
    assert.ok(noDrift<z.input<typeof profileRowSchema>, Row<"profiles">>());
    assert.ok(noDrift<z.input<typeof planRowSchema>, Row<"nutrition_plans">>());
    assert.ok(noDrift<Omit<MealIn, "meal_items">, Row<"meals">>());
    assert.ok(noDrift<Omit<MealIn["meal_items"][number], "foods">, Row<"meal_items">>());
    assert.ok(noDrift<z.input<typeof loggedMealRowSchema>, Row<"meals">>());
  });

  it("maps a profile row and keeps unanswered fields null", () => {
    const p = profileRowSchema.parse({
      id: MEAL_ID,
      sex: null,
      birth_year: null,
      height_cm: "180.0",
      weight_kg: null,
      goal_weight_kg: null,
      activity_level: "veryActive",
      diet_style: null,
      fat_per_kg: "1.20",
      time_zone: "Europe/Istanbul",
      onboarding_completed: false,
      sensitive_warning_ack: false,
    });
    assert.equal(p.heightCm, 180);
    assert.equal(p.fatPerKg, 1.2);
    assert.equal(p.sex, null);
    assert.equal(p.activityLevel, "veryActive");
  });

  it("maps a plan row back to the plan it was saved from", () => {
    const plan = buildPlan(inputs, { id: MEAL_ID, createdAt: "2026-10-09T10:00:00.000Z" });
    const row = {
      id: plan.id,
      created_at: plan.createdAt,
      inputs: plan.inputs,
      bmr: plan.bmr,
      tdee: plan.tdee,
      summary: plan.strategySummary,
      base_kcal: plan.base.calories,
      base_protein_g: plan.base.protein,
      base_carbs_g: plan.base.carbs,
      base_fat_g: plan.base.fat,
      training_kcal: null,
      training_protein_g: null,
      training_carbs_g: null,
      training_fat_g: null,
      rest_kcal: null,
      rest_protein_g: null,
      rest_carbs_g: null,
      rest_fat_g: null,
    };
    assert.deepEqual(planRowSchema.parse(row), plan);
  });

  it("maps a meal row, coerces numbers and orders items by position", () => {
    const item = (id: string, position: number, food: string) => ({
      id,
      food_id: food,
      grams: "150.0",
      kcal_per_100g: "165.00",
      protein_per_100g: "31.00",
      carbs_per_100g: "0.00",
      fat_per_100g: "3.60",
      position,
      foods: { name_tr: food === "chicken" ? "Izgara tavuk göğsü" : "Pirinç pilavı" },
    });
    const meal = mealRowSchema.parse({
      id: MEAL_ID,
      slot: "lunch",
      local_date: "2026-10-09",
      time_zone: "Europe/Istanbul",
      logged_at: "2026-10-09T10:15:00+00:00",
      name: "Öğle yemeği",
      total_kcal: "495.0",
      total_protein_g: "93.0",
      total_carbs_g: "0.0",
      total_fat_g: "10.8",
      meal_items: [item("2b0f6a35-1c1e-4f7a-9d6e-0a1b2c3d4e5f", 1, "rice"), item("3c1a7b46-2d2f-4a8b-8e7f-1b2c3d4e5f60", 0, "chicken")],
    });
    assert.equal(meal.totals.calories, 495);
    assert.deepEqual(meal.items.map((i) => i.foodId), ["chicken", "rice"]);
    assert.equal(meal.items[0].per100g.fat, 3.6);
  });

  it("maps the meal log_meal returns, without items", () => {
    const meal = loggedMealRowSchema.parse({
      id: MEAL_ID,
      user_id: MEAL_ID,
      slot: "dinner",
      local_date: "2026-10-11",
      time_zone: "Europe/Istanbul",
      logged_at: "2026-10-11T17:00:00+00:00",
      name: "Akşam yemeği",
      total_kcal: "345.2",
      total_protein_g: "31.8",
      total_carbs_g: "38.4",
      total_fat_g: "12.2",
      created_at: "2026-10-11T17:00:00+00:00",
      updated_at: "2026-10-11T17:00:00+00:00",
    });
    assert.deepEqual(meal, { id: MEAL_ID, slot: "dinner", localDate: "2026-10-11", totals: { calories: 345.2, protein: 31.8, carbs: 38.4, fat: 12.2 } });
  });

  it("maps a search hit", () => {
    const hit = foodHitRowSchema.parse({
      food_id: "chicken",
      name_tr: "Izgara tavuk göğsü",
      matched_alias: "tavuk",
      typical_portion_g: "150.0",
      kcal_per_100g: "165.00",
      protein_per_100g: "31.00",
      carbs_per_100g: "0.00",
      fat_per_100g: "3.60",
    });
    assert.equal(hit.typicalPortionG, 150);
    assert.equal(hit.per100g.calories, 165);
  });
});

describe("log_meal payload", () => {
  const valid = { slot: "lunch", localDate: "2026-10-09", timeZone: "Europe/Istanbul", name: "Öğle yemeği", items: [{ foodId: "chicken", grams: 150 }] };

  it("accepts a valid meal", () => assert.ok(logMealPayloadSchema.safeParse(valid).success));

  it("rejects 0 g, more than 5000 g, an impossible date and an empty meal", () => {
    for (const bad of [
      { ...valid, items: [{ foodId: "chicken", grams: 0 }] },
      { ...valid, items: [{ foodId: "chicken", grams: 5001 }] },
      { ...valid, localDate: "2026-02-30" },
      { ...valid, items: [] },
    ]) {
      assert.equal(logMealPayloadSchema.safeParse(bad).success, false, JSON.stringify(bad));
    }
  });
});
