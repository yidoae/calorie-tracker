import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { baseGrams, formulaPlan, LOW_CARB_MAX_G, macrosFor } from "@/lib/nutrition/plan";
import { planInputsSchema, type PlanInputs } from "@/types/plan";

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
