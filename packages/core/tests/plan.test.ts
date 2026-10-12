import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { baseGrams, buildPlan, formulaPlan, LOW_CARB_MAX_G, macrosFor } from "../src/nutrition/plan.ts";
import { tunedPlan, tunerDays } from "../src/nutrition/planTuning.ts";
import { planInputsSchema, type PlanInputs } from "../src/schemas/plan.ts";

const inputs: PlanInputs = {
  sex: "male",
  heightCm: 180,
  weightKg: 80,
  age: 30,
  targetWeightKg: 75,
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

const kcalOf = (d: { protein: number; carbs: number; fat: number }) => d.protein * 4 + d.carbs * 4 + d.fat * 9;

describe("macro engine", () => {
  it("protein 2.2 g/kg, fat as chosen, carbs fill the rest", () => {
    const d = macrosFor(2280, baseGrams(inputs), "highProtein");
    assert.equal(d.protein, 176);
    assert.equal(d.fat, 96);
    assert.equal(d.carbs, 178);
    assert.ok(Math.abs(kcalOf(d) - 2280) <= 6, "macros add up to the calories (rounding only)");
  });

  it("fat follows the 1.0–1.5 g/kg slider", () => {
    assert.equal(macrosFor(2500, baseGrams({ ...inputs, fatPerKg: 1.5 }), "highProtein").fat, 120);
    assert.equal(macrosFor(2500, baseGrams({ ...inputs, fatPerKg: 1 }), "highProtein").fat, 80);
  });

  it("keto keeps carbs at 15–30 g and low-carb at most 100 g; fat absorbs the rest", () => {
    const keto = macrosFor(2200, baseGrams(inputs), "keto");
    assert.ok(keto.carbs >= 15 && keto.carbs <= 30);
    assert.ok(Math.abs(kcalOf(keto) - 2200) <= 6);
    const low = macrosFor(2800, baseGrams(inputs), "lowCarb");
    assert.equal(low.carbs, LOW_CARB_MAX_G);
    assert.ok(Math.abs(kcalOf(low) - 2800) <= 6);
  });

  it("never goes negative when protein + fat exceed the calories", () => {
    const d = macrosFor(1000, baseGrams(inputs), "highProtein");
    assert.equal(d.carbs, 0);
    assert.ok(d.fat >= 0);
  });

  it("uses the BMI-27 reference weight for very heavy users", () => {
    assert.ok(baseGrams({ weightKg: 140, heightCm: 175, fatPerKg: 1.2 }).protein < 140 * 2.2);
  });
});

describe("formulaPlan", () => {
  it("a cut lands below maintenance", () => {
    const r = formulaPlan(inputs);
    assert.ok(r.base.calories < r.tdee);
  });

  it("plans saved before fatPerKg existed read the 1.2 g/kg default", () => {
    const old: Record<string, unknown> = { ...inputs };
    delete old.fatPerKg;
    assert.equal(planInputsSchema.parse(old).fatPerKg, 1.2);
  });
});

describe("tunedPlan", () => {
  const training = { calories: 1920, protein: 154, carbs: 175, fat: 67 };
  const rest = { calories: 1440, protein: 154, carbs: 0, fat: 92 };
  const plan = buildPlan({ ...inputs, cycling: true }, { id: "p", createdAt: "2026-10-12T00:00:00.000Z" });

  it("starts the tuning desk from the plan's days (base for every tab when it does not cycle)", () => {
    const flat = buildPlan(inputs, { id: "p", createdAt: "2026-10-12T00:00:00.000Z" });
    assert.deepEqual(tunerDays(flat), { base: flat.base, training: flat.base, rest: flat.base });
    assert.ok(plan.cycle);
    assert.deepEqual(tunerDays(plan), { base: plan.base, training: plan.cycle.training, rest: plan.cycle.rest });
  });

  it("a cycling plan's base becomes the weekly average, nudged so its grams add up to its calories", () => {
    const tuned = tunedPlan(plan, { base: plan.base, training, rest });
    assert.deepEqual(tuned.cycle, { training, rest });
    // (1920·4 + 1440·3) / 7 = 1714.3 kcal; protein stays, carbs and fat share the rest.
    assert.deepEqual(tuned.base, { calories: 1714, protein: 154, carbs: 100, fat: 78 });
    assert.ok(Math.abs(kcalOf(tuned.base) - tuned.base.calories) <= 10);
  });

  it("a plan without cycling keeps the tuned base and no cycle", () => {
    const flat = buildPlan(inputs, { id: "p", createdAt: "2026-10-12T00:00:00.000Z" });
    const base = { calories: 2000, protein: 180, carbs: 200, fat: 51 };
    const tuned = tunedPlan(flat, { base, training, rest });
    assert.deepEqual(tuned.base, base);
    assert.equal(tuned.cycle, null);
    assert.equal(tuned.id, flat.id);
    assert.deepEqual(tuned.inputs, flat.inputs);
  });
});
