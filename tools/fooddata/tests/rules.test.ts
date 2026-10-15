import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkFoods, type ResolvedFood, type RuleContext } from "../src/rules.ts";

function food(over: Partial<ResolvedFood> = {}): ResolvedFood {
  return {
    id: "egg_raw",
    name: "Yumurta (çiğ)",
    category: "egg",
    sourceKind: "usda",
    sourceRef: "FDC 748967 (Foundation, 2026-04)",
    per100: { kcal: 143, protein: 12.6, carbs: 0.7, fat: 9.5, alcohol: 0 },
    typicalPortionG: 50,
    portions: [{ unit: "adet", grams: 50 }],
    aliases: ["yumurta"],
    ...over,
  };
}

const ctx: RuleContext = { legacyIds: [], minFoods: 0, minDishes: 0 };

/** The failures for `foods`, so each test can look for the one it provoked. */
const check = (foods: ResolvedFood[], c = ctx) => checkFoods(foods, c);
const hasError = (errors: string[], ...parts: string[]) => errors.some((e) => parts.every((p) => e.includes(p)));

describe("build rules", () => {
  it("passes a valid food", () => {
    assert.deepEqual(check([food()]), []);
  });

  it("refuses duplicate ids and bad id patterns", () => {
    assert.ok(hasError(check([food(), food({ aliases: ["yumurta 2"] })]), "egg_raw", "duplicate id"));
    assert.ok(hasError(check([food({ id: "Egg-Raw" })]), "Egg-Raw", "id"));
  });

  it("requires every 001 id", () => {
    assert.ok(hasError(check([food()], { ...ctx, legacyIds: ["egg_raw", "simit"] }), "simit", "001"));
  });

  it("limits names to 80 characters", () => {
    assert.ok(hasError(check([food({ name: "x".repeat(81) })]), "egg_raw", "name"));
  });

  it("keeps brands out of a label food's name and aliases", () => {
    const label = food({ id: "wafer", name: "Gofret", category: "sweet", sourceKind: "label", brand: "Ülker", aliases: ["gofret", "ulker gofret"] });
    assert.ok(hasError(check([label]), "wafer", "brand"));
    assert.deepEqual(check([{ ...label, aliases: ["gofret"] }]), []);
  });

  it("needs an alias and refuses a normalised alias shared by two foods, naming both", () => {
    assert.ok(hasError(check([food({ aliases: [] })]), "egg_raw", "alias"));
    const errors = check([food(), food({ id: "egg_boiled", name: "Yumurta (haşlanmış)", aliases: ["YUMURTA"] })]);
    assert.ok(hasError(errors, "egg_raw", "egg_boiled", "alias"));
  });

  it("keeps per-100 g values in range", () => {
    assert.ok(hasError(check([food({ per100: { kcal: 950, protein: 0, carbs: 0, fat: 100, alcohol: 0 } })]), "egg_raw", "kcal"));
    assert.ok(hasError(check([food({ per100: { kcal: 143, protein: -1, carbs: 0.7, fat: 9.5, alcohol: 0 } })]), "egg_raw", "protein"));
  });

  it("refuses energy more than 20 % (or 10 kcal) off 4P + 4C + 9F + 7A, counting alcohol", () => {
    assert.ok(hasError(check([food({ per100: { kcal: 200, protein: 12.6, carbs: 0.7, fat: 9.5, alcohol: 0 } })]), "egg_raw", "energy"));
    // Beer: 43 kcal from 0.5 g protein, 3.6 g carbs and 3.9 g alcohol (≈ 43.7 kcal).
    const beer = food({ id: "beer", name: "Bira", category: "alcohol", per100: { kcal: 43, protein: 0.5, carbs: 3.6, fat: 0, alcohol: 3.9 }, aliases: ["bira"], portions: [] });
    assert.deepEqual(check([beer]), []);
    // Broccoli: USDA 34 kcal against 41 from 4/4/9 (fibre in carbs); within 10 kcal.
    const broccoli = food({ id: "broccoli", name: "Brokoli", category: "vegetable", per100: { kcal: 34, protein: 2.8, carbs: 6.6, fat: 0.4, alcohol: 0 }, aliases: ["brokoli"], portions: [] });
    assert.deepEqual(check([broccoli]), []);
    // A reviewed exception skips the check (lemon: citric acid and fibre in USDA carbohydrate).
    const lemon = food({ id: "lemon", name: "Limon", category: "fruit", per100: { kcal: 29, protein: 1.1, carbs: 9.32, fat: 0.3, alcohol: 0 }, aliases: ["limon"], portions: [] });
    assert.ok(hasError(check([lemon]), "lemon", "energy"));
    assert.deepEqual(check([{ ...lemon, energyException: "citric acid counted in carbohydrate" }]), []);
    // Under 20 kcal rounding dominates: tea is exempt.
    const tea = food({ id: "tea", name: "Çay", category: "drink", per100: { kcal: 1, protein: 0, carbs: 0.3, fat: 0, alcohol: 0 }, aliases: ["çay"], portions: [] });
    assert.deepEqual(check([tea]), []);
  });

  it("keeps portions above 0 and at most 5000 g, with unique units", () => {
    assert.ok(hasError(check([food({ typicalPortionG: 0 })]), "egg_raw", "portion"));
    assert.ok(hasError(check([food({ portions: [{ unit: "adet", grams: 5001 }] })]), "egg_raw", "adet"));
    assert.ok(hasError(check([food({ portions: [{ unit: "adet", grams: 50 }, { unit: "adet", grams: 60 }] })]), "egg_raw", "adet"));
  });

  it("checks recipes: known usda ingredients and a cooked weight within the pot", () => {
    const soup = (over: Partial<NonNullable<ResolvedFood["recipe"]>> = {}) =>
      food({
        id: "lentil_soup",
        name: "Mercimek çorbası",
        category: "dish",
        sourceKind: "recipe",
        aliases: ["mercimek çorbası"],
        per100: { kcal: 56, protein: 3.5, carbs: 9, fat: 0.8, alcohol: 0 },
        recipe: { ingredients: [{ foodId: "egg_raw", grams: 200 }], waterG: 800, cookedG: 900, ...over },
      });
    assert.deepEqual(check([food(), soup()]), []);
    assert.ok(hasError(check([food(), soup({ ingredients: [{ foodId: "nope", grams: 10 }] })]), "lentil_soup", "nope"));
    assert.ok(hasError(check([food(), soup({ cookedG: 1001 })]), "lentil_soup", "cooked"));
    const label = food({ id: "wafer", name: "Gofret", category: "sweet", sourceKind: "label", brand: "X", aliases: ["gofret"], portions: [] });
    assert.ok(hasError(check([label, soup({ ingredients: [{ foodId: "wafer", grams: 10 }] })]), "lentil_soup", "wafer"));
  });

  it("keeps bare staple names on the raw or dry food (FR-005)", () => {
    const raw = food({ id: "rice_raw", name: "Pirinç (çiğ)", category: "grain", aliases: ["pirinç"], portions: [], per100: { kcal: 360, protein: 6.6, carbs: 79, fat: 0.6, alcohol: 0 } });
    const cooked = food({ id: "rice_cooked", name: "Pirinç pilavı (pişmiş)", category: "grain", aliases: ["pilav", "pirinc"], portions: [], per100: { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3, alcohol: 0 } });
    assert.ok(hasError(check([raw, cooked]), "rice_cooked", "staple"));
  });

  it("enforces the food and dish counts", () => {
    assert.ok(hasError(check([food()], { ...ctx, minFoods: 2 }), "foods"));
    assert.ok(hasError(check([food()], { ...ctx, minDishes: 1 }), "dishes"));
  });

  it("reports every failure, not only the first", () => {
    const errors = check([food({ id: "BAD", name: "x".repeat(81), aliases: [] })]);
    assert.ok(errors.length >= 3);
  });
});
