import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { addFood, EMPTY_DRAFT, setDraftGrams, setDraftPortion } from "../src/hooks/mealLogic.ts";
import { canStep, gramsForPick, pickUnit, stepPick } from "../src/hooks/portionLogic.ts";
import type { FoodHit } from "@calorie/core/schemas/rows";

const portions = [
  { unit: "adet", grams: 50 },
  { unit: "kase", grams: 2400 },
  { unit: "avuç", grams: 1.25 },
];

describe("portion shortcuts (002 US2, clarify Q1)", () => {
  it("choosing a unit starts at one and writes its grams", () => {
    const pick = pickUnit("adet");
    assert.deepEqual(pick, { unit: "adet", count: 1 });
    assert.equal(gramsForPick(portions, pick), "50");
  });

  it("+ and − change the count by one and never go below one", () => {
    const two = stepPick(portions, { unit: "adet", count: 1 }, 1);
    assert.deepEqual(two, { unit: "adet", count: 2 });
    assert.equal(gramsForPick(portions, two), "100");
    assert.deepEqual(stepPick(portions, { unit: "adet", count: 1 }, -1), { unit: "adet", count: 1 });
    assert.equal(canStep(portions, { unit: "adet", count: 1 }, -1), false);
  });

  it("rounds to 0.1 g and writes a Turkish decimal comma, like the gram field", () => {
    assert.equal(gramsForPick(portions, { unit: "avuç", count: 3 }), "3,8");
  });

  it("stops + before the count passes 5000 g", () => {
    // 2 kase = 4800 g is allowed; 3 kase = 7200 g is not.
    assert.equal(canStep(portions, { unit: "kase", count: 1 }, 1), true);
    assert.equal(canStep(portions, { unit: "kase", count: 2 }, 1), false);
    assert.deepEqual(stepPick(portions, { unit: "kase", count: 2 }, 1), { unit: "kase", count: 2 });
  });
});

describe("the draft keeps the pick until grams are typed", () => {
  const egg: FoodHit = { foodId: "egg", name: "Yumurta", matchedAlias: "yumurta", typicalPortionG: 50, per100g: { calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 }, portions };
  const draft = addFood(EMPTY_DRAFT, egg);
  const key = draft.items[0].key;

  it("a pick writes the grams and remembers the unit and count", () => {
    const picked = setDraftPortion(draft, key, { unit: "adet", count: 2 });
    assert.equal(picked.items[0].gramsText, "100");
    assert.deepEqual(picked.items[0].portion, { unit: "adet", count: 2 });
  });

  it("typing grams clears the pick; the field is the only saved value", () => {
    const typed = setDraftGrams(setDraftPortion(draft, key, { unit: "adet", count: 2 }), key, "120");
    assert.equal(typed.items[0].gramsText, "120");
    assert.equal(typed.items[0].portion, null);
  });
});
