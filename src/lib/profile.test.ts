import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  bmiCategory,
  calculateBmi,
  calculateBmr,
  calculateTargets,
  calculateTdee,
  healthyWeightRange,
  inRange,
  isValidProfile,
  parseProfile,
  type Profile,
} from "./profile";

const man: Profile = { gender: "male", heightCm: 180, weightKg: 80, age: 30, activity: "moderate" };
const woman: Profile = { gender: "female", heightCm: 165, weightKg: 60, age: 25, activity: "sedentary" };

describe("calculateBmi", () => {
  test("is weight over height squared, rounded to one decimal", () => {
    assert.equal(calculateBmi(man), 24.7); // 80 / 1.8² = 24.69…
    assert.equal(calculateBmi(woman), 22); // 60 / 1.65² = 22.03…
  });
});

describe("bmiCategory", () => {
  test("uses WHO cut-offs with exclusive upper bounds", () => {
    assert.equal(bmiCategory(18.4).label, "Underweight");
    assert.equal(bmiCategory(18.5).label, "Normal");
    assert.equal(bmiCategory(24.9).label, "Normal");
    assert.equal(bmiCategory(25).label, "Overweight");
    assert.equal(bmiCategory(29.9).label, "Overweight");
    assert.equal(bmiCategory(30).label, "Obese");
    assert.equal(bmiCategory(80).label, "Obese");
  });
});

describe("healthyWeightRange", () => {
  test("returns whole kilograms inside the Normal BMI band", () => {
    const range = healthyWeightRange(180);
    assert.deepEqual(range, { min: 60, max: 80 });
    assert.equal(bmiCategory(calculateBmi({ heightCm: 180, weightKg: range.min })).label, "Normal");
    assert.equal(bmiCategory(calculateBmi({ heightCm: 180, weightKg: range.max })).label, "Normal");
  });
});

describe("calculateBmr", () => {
  test("follows Mifflin-St Jeor for each gender", () => {
    assert.equal(calculateBmr(man), 1780); // 800 + 1125 - 150 + 5
    assert.equal(calculateBmr(woman), 1345.25); // 600 + 1031.25 - 125 - 161
  });
});

describe("calculateTdee", () => {
  test("scales BMR by the activity factor", () => {
    assert.equal(calculateTdee(man), 1780 * 1.55);
    assert.equal(calculateTdee(woman), 1345.25 * 1.2);
    assert.equal(calculateTdee({ ...man, activity: "veryActive" }), 1780 * 1.9);
  });
});

describe("calculateTargets", () => {
  test("splits maintenance calories into protein, fat and carbs", () => {
    assert.deepEqual(calculateTargets(man), { calories: 2759, protein: 128, carbs: 389, fat: 77 });
    assert.deepEqual(calculateTargets(woman), { calories: 1614, protein: 96, carbs: 206, fat: 45 });
  });

  test("macros add back up to roughly the calorie target", () => {
    for (const p of [man, woman, { ...man, weightKg: 120, activity: "active" as const }]) {
      const t = calculateTargets(p);
      const kcal = t.protein * 4 + t.carbs * 4 + t.fat * 9;
      assert.ok(Math.abs(kcal - t.calories) <= 6, `${kcal} vs ${t.calories}`);
    }
  });
});

describe("profile validation", () => {
  test("inRange is inclusive and rejects non-finite values", () => {
    assert.equal(inRange("age", 15), true);
    assert.equal(inRange("age", 100), true);
    assert.equal(inRange("age", 14), false);
    assert.equal(inRange("heightCm", 251), false);
    assert.equal(inRange("weightKg", Number.NaN), false);
    assert.equal(inRange("weightKg", Infinity), false);
  });

  test("isValidProfile checks gender, activity and every range", () => {
    assert.equal(isValidProfile(man), true);
    assert.equal(isValidProfile({ ...man, gender: "other" as Profile["gender"] }), false);
    assert.equal(isValidProfile({ ...man, activity: "couch" as Profile["activity"] }), false);
    assert.equal(isValidProfile({ ...man, weightKg: 29 }), false);
  });
});

describe("parseProfile", () => {
  test("returns only the known fields of a valid profile", () => {
    assert.deepEqual(parseProfile(JSON.stringify({ ...man, extra: "x" })), man);
  });

  test("returns null for missing, malformed or invalid data", () => {
    assert.equal(parseProfile(null), null);
    assert.equal(parseProfile(""), null);
    assert.equal(parseProfile("{not json"), null);
    assert.equal(parseProfile(JSON.stringify({ ...man, age: 5 })), null);
    assert.equal(parseProfile(JSON.stringify({ ...man, heightCm: "180" })), null);
  });
});
