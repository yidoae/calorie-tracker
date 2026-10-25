import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { rateDay } from "../src/nutrition/dayRating.ts";
import { bmiCategory, calculateBmi } from "../src/nutrition/energy.ts";
import { slotForHour, slotTargets } from "../src/nutrition/slots.ts";

describe("rateDay", () => {
  it("±5 % of the goal is on target, the bounds included", () => {
    assert.equal(rateDay(950, 1000), "onTarget");
    assert.equal(rateDay(1050, 1000), "onTarget");
    assert.equal(rateDay(949, 1000), "under");
    assert.equal(rateDay(1051, 1000), "over");
  });

  it("a day with no goal is on target", () => {
    assert.equal(rateDay(500, 0), "onTarget");
  });
});

describe("BMI", () => {
  it("rounds to one decimal and the category follows the rounded value", () => {
    assert.equal(calculateBmi({ heightCm: 180, weightKg: 81 }), 25);
    assert.equal(bmiCategory(25).tone, "amber");
    assert.equal(bmiCategory(24.9).tone, "emerald");
    assert.equal(bmiCategory(18.4).tone, "sky");
    assert.equal(bmiCategory(30).tone, "red");
  });
});

describe("meal slots", () => {
  it("the hour picks the slot; the gaps between meals are snacks", () => {
    assert.deepEqual([4, 5, 10, 11, 15, 16, 17, 22, 23].map(slotForHour), ["snack", "breakfast", "breakfast", "lunch", "lunch", "snack", "dinner", "dinner", "snack"]);
  });

  it("shares the day to 10 kcal; 16:8 has no breakfast", () => {
    assert.deepEqual(slotTargets(2000), { breakfast: 500, lunch: 700, dinner: 600, snack: 200 });
    assert.deepEqual(slotTargets(2000, "if168"), { lunch: 900, dinner: 800, snack: 300 });
  });
});
