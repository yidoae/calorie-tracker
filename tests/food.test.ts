import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FOODS, searchFoods } from "@/lib/nutrition/foods";
import { parseMealText } from "@/lib/nutrition/quickParse";
import { filledGlasses, glassCount } from "@/lib/nutrition/water";

describe("quick bar: chicken forms", () => {
  const cases: [string, string, number][] = [
    ["200g ızgara tavuk", "chicken", 200],
    ["250 gr haşlanmış tavuk", "chickenBoiled", 250],
    ["2 tavuk but", "chickenThigh", 180],
    ["tavuk kanat 6 adet", "chickenWing", 210],
    ["fırında tavuk", "chickenRoast", 180],
    ["1 kase tavuk sote", "chickenSaute", 250],
    ["200 g çiğ tavuk göğsü", "chickenBreastRaw", 200],
    ["çıtır tavuk", "friedChicken", 150],
  ];
  for (const [text, foodId, grams] of cases) {
    it(text, () => assert.deepEqual(parseMealText(text).foods[0], { foodId, grams }));
  }

  it("still parses the documented example", () => {
    const r = parseMealText("Öğlen 200g ızgara tavuk, bol salata ve 1 dilim tam buğday ekmeği");
    assert.deepEqual(
      r.foods.map((f) => f.foodId),
      ["chicken", "greens", "wholeWheatBread"],
    );
    assert.equal(r.slot, "lunch");
    assert.deepEqual(r.unmatched, []);
  });
});

describe("food database", () => {
  it("has unique ids and calories that roughly match the macros", () => {
    assert.equal(new Set(FOODS.map((f) => f.id)).size, FOODS.length);
    for (const f of FOODS) {
      const kcal = f.per100g.protein * 4 + f.per100g.carbs * 4 + f.per100g.fat * 9;
      assert.ok(Math.abs(kcal - f.per100g.calories) <= Math.max(40, f.per100g.calories * 0.2), `${f.id}: ${kcal} vs ${f.per100g.calories}`);
    }
  });

  it("search: Turkish-case-insensitive, names before aliases", () => {
    assert.equal(searchFoods("IZGARA")[0]?.id, "chicken");
    assert.ok(searchFoods("baget").some((f) => f.id === "chickenThigh"));
    assert.equal(searchFoods("").length, FOODS.length);
    assert.equal(searchFoods("xyzxyz").length, 0);
  });
});

describe("water glasses", () => {
  it("glasses for the goal (4–16) and full glasses for the total", () => {
    assert.equal(glassCount(2500), 10);
    assert.equal(glassCount(500), 4);
    assert.equal(glassCount(6000), 16);
    assert.equal(filledGlasses(749), 2);
    assert.equal(filledGlasses(750), 3);
  });
});
