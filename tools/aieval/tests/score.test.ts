import assert from "node:assert/strict";
import { test } from "node:test";
import { median, phrasePasses, scorePlate } from "../src/score.ts";

test("a phrase passes only with exactly the expected foods, grams within 1 g or 2 %", () => {
  assert.equal(phrasePasses([{ food_id: "egg", grams: 100.5 }], [{ food_id: "egg", grams: 100 }]), true);
  assert.equal(phrasePasses([{ food_id: "egg", grams: 103 }], [{ food_id: "egg", grams: 100 }]), false);
  assert.equal(phrasePasses([{ food_id: "egg", grams: 100 }, { food_id: "tea", grams: 100 }], [{ food_id: "egg", grams: 100 }]), false);
});

test("a plate is scored per food", () => {
  const s = scorePlate([{ food_id: "rice", grams: 120 }, { food_id: "salad", grams: 50 }], [{ food_id: "rice", grams: 150 }, { food_id: "kofte", grams: 100 }]);
  assert.deepEqual(s, { found: 1, expected: 2, falsePositives: 1, proposed: 2, weightErrors: [0.2] });
});

test("median", () => {
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1, 2, 3]), 2.5);
  assert.ok(Number.isNaN(median([])));
});

test("each expected food needs its own predicted item", () => {
  const egg = { food_id: "egg", grams: 50 };
  assert.equal(phrasePasses([egg, { food_id: "tea", grams: 100 }], [egg, egg]), false);
  assert.equal(phrasePasses([egg, egg], [egg, egg]), true);
});
