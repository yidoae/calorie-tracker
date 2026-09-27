import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { NO_FOOD_MESSAGE, NoFoodError, normalize, type NutritionData } from "./vision";

const valid: NutritionData = { name: "Chicken salad", calories: 412.6, protein: 31.26, carbs: 12.04, fat: 25.95 };

describe("normalize", () => {
  test("rounds calories to whole kcal and macros to one decimal", () => {
    assert.deepEqual(normalize(valid), { name: "Chicken salad", calories: 413, protein: 31.3, carbs: 12, fat: 26 });
  });

  test("trims the name and caps it at 120 characters", () => {
    assert.equal(normalize({ ...valid, name: "  Pasta  " }).name, "Pasta");
    assert.equal(normalize({ ...valid, name: "x".repeat(200) }).name.length, 120);
  });

  test("accepts zeros", () => {
    assert.deepEqual(normalize({ name: "Water", calories: 0, protein: 0, carbs: 0, fat: 0 }), {
      name: "Water",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    });
  });

  const invalid: [string, Partial<Record<keyof NutritionData, unknown>>][] = [
    ["an empty name", { name: "" }],
    ["a whitespace-only name", { name: "   " }],
    ["a non-string name", { name: 42 }],
    ["negative calories", { calories: -1 }],
    ["NaN protein", { protein: Number.NaN }],
    ["infinite carbs", { carbs: Infinity }],
    ["a numeric string for fat", { fat: "10" }],
    ["missing calories", { calories: undefined }],
  ];
  for (const [label, override] of invalid) {
    test(`rejects ${label}`, () => {
      assert.throws(() => normalize({ ...valid, ...override } as NutritionData), /invalid nutrition data/);
    });
  }
});

describe("NoFoodError", () => {
  test("carries the user-facing message and a log-only reason", () => {
    const err = new NoFoodError("too dark");
    assert.ok(err instanceof Error);
    assert.equal(err.name, "NoFoodError");
    assert.equal(err.message, NO_FOOD_MESSAGE);
    assert.equal(err.reason, "too dark");
  });
});
