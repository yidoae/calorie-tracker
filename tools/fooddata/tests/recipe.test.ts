import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cookedWeight, recipePer100, round } from "../src/recipe.ts";

const ingredients = [{ grams: 200 }, { grams: 100 }];

describe("cooked weight", () => {
  it("uses the owner's weighing when there is one", () => {
    assert.equal(cookedWeight({ ingredients, waterG: 700, yield: { kind: "weighed", grams: 850, date: "2026-10-15" } }), 850);
  });

  it("applies an FNDDS moisture change to ingredients plus water", () => {
    // (300 + 700) × (1 − 15 / 100)
    assert.equal(cookedWeight({ ingredients, waterG: 700, yield: { kind: "fndds", foodCode: 28340110, moisturePct: -15 } }), 850);
  });

  it("applies a USDA meat yield to ingredients plus water", () => {
    assert.equal(cookedWeight({ ingredients, waterG: 0, yield: { kind: "usda_meat_yield", table: "beef, ground, broiled", yieldPct: 75 } }), 225);
  });
});

describe("values per 100 g of a dish", () => {
  const lentils = { kcal: 352, protein: 24.6, carbs: 63, fat: 1.1, alcohol: 0 };
  const oil = { kcal: 884, protein: 0, carbs: 0, fat: 100, alcohol: 0 };

  it("sums the ingredients and divides by the cooked weight; water adds weight only", () => {
    const v = recipePer100([{ grams: 200, per100: lentils }, { grams: 20, per100: oil }], 1000);
    // (2 × 352 + 0.2 × 884) / 1000 × 100 = 88.08
    assert.deepEqual(v, { kcal: 88.08, protein: 4.92, carbs: 12.6, fat: 2.22, alcohol: 0 });
  });

  it("rounds half-up after the full-precision sum", () => {
    assert.equal(round(1.005, 2), 1.01);
    assert.equal(round(2.675, 2), 2.68);
    assert.equal(round(0.04999, 1), 0);
  });
});
