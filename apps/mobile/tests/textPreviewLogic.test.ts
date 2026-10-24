import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { FoodHit } from "@calorie/core/schemas/rows";
import { parseMeal } from "@calorie/core/text/parseMeal";
import { PORTION_UNITS } from "@calorie/core/text/units";
import { previewLine, proposedFoods } from "../src/hooks/textPreviewLogic.ts";

const hit = (foodId: string, name: string, typicalPortionG: number, portions: { unit: string; grams: number }[] = []): FoodHit => ({
  foodId,
  name,
  matchedAlias: name.toLocaleLowerCase("tr-TR"),
  typicalPortionG,
  per100g: { calories: 100, protein: 1, carbs: 1, fat: 1 },
  portions,
});
const EGG = hit("egg", "Yumurta", 100, [{ unit: "adet", grams: 50 }]);
const SIMIT = hit("simit", "Simit", 120, [{ unit: "adet", grams: 120 }]);
const BREAD = hit("white_bread", "Beyaz ekmek", 50, [{ unit: "dilim", grams: 30 }]);
const CHICKEN = hit("chicken_breast_raw", "Tavuk göğsü (çiğ)", 200);
const SUGAR = hit("sugar", "Toz şeker", 5);
const TEA = hit("tea", "Çay (şekersiz)", 100, [{ unit: "ince belli bardak", grams: 100 }]);
const SOUP = hit("lentil_soup", "Mercimek çorbası", 250, [{ unit: "kase", grams: 250 }]);

const phrase = (text: string) => parseMeal(text, PORTION_UNITS)[0];

describe("text preview: one phrase and its hits", () => {
  it("amount × the matching portion", () => {
    assert.deepEqual(previewLine(phrase("2 dilim ekmek"), [BREAD]), { phrase: "2 dilim ekmek", food: BREAD, grams: 60, estimated: false });
  });

  it("grams as written", () => {
    assert.deepEqual(previewLine(phrase("iki yüz gram tavuk göğsü"), [CHICKEN])?.grams, 200);
  });

  it("a number alone uses the first portion: 2 yumurta → 100 g, yarım simit → 60 g", () => {
    assert.equal(previewLine(phrase("2 yumurta"), [EGG])?.grams, 100);
    assert.equal(previewLine(phrase("yarım simit"), [SIMIT])?.grams, 60);
  });

  it("a bare count prefers the adet portion over the first one", () => {
    const CHERRIES = hit("cherries", "Kiraz", 150, [{ unit: "kase", grams: 150 }, { unit: "adet", grams: 8 }]);
    assert.equal(previewLine(phrase("10 kiraz"), [CHERRIES])?.grams, 80);
  });

  it("no amount: the typical portion, marked as an estimate", () => {
    assert.deepEqual(previewLine(phrase("mercimek çorbası"), [SOUP]), { phrase: "mercimek çorbası", food: SOUP, grams: 250, estimated: true });
  });

  it("a unit the food does not have, or a number without portions: typical portion × amount, estimated", () => {
    assert.deepEqual(previewLine(phrase("2 kase tavuk"), [CHICKEN]), { phrase: "2 kase tavuk", food: CHICKEN, grams: 400, estimated: true });
  });

  it("a negated word prefers the food whose name carries it", () => {
    assert.equal(previewLine(phrase("şekersiz çay"), [SUGAR, TEA])?.food?.foodId, "tea");
    assert.equal(previewLine(phrase("çay"), [SUGAR, TEA])?.food?.foodId, "sugar", "without negation the first hit stays");
  });

  it("a stated unit prefers the hit that has it", () => {
    const DONER = hit("doner", "Döner", 150);
    const WRAP = hit("doner_wrap", "Dürüm döner", 250, [{ unit: "adet", grams: 250 }]);
    assert.deepEqual(previewLine(phrase("1 dürüm döner"), [DONER, WRAP]), { phrase: "1 dürüm döner", food: WRAP, grams: 250, estimated: false });
    assert.equal(previewLine(phrase("döner"), [DONER, WRAP])?.food?.foodId, "doner", "without a unit the first hit stays");
  });

  it("grams are capped at 5000 and rounded to 0.1 g", () => {
    assert.equal(previewLine(phrase("100 kase mercimek çorbası"), [SOUP])?.grams, 5000);
    assert.equal(previewLine(phrase("1,333 dilim ekmek"), [BREAD])?.grams, 40);
  });

  it("no hits: the phrase is unmatched", () => {
    assert.deepEqual(previewLine(phrase("uzay yemeği"), []), { phrase: "uzay yemeği", food: null, grams: null, estimated: true });
  });
});

describe("text preview → draft", () => {
  it("matched lines become proposed foods; unmatched ones stay out", () => {
    const lines = [previewLine(phrase("2 yumurta"), [EGG]), previewLine(phrase("uzay yemeği"), []), previewLine(phrase("mercimek çorbası"), [SOUP])];
    assert.deepEqual(proposedFoods(lines), [
      { food: EGG, grams: 100, estimated: false },
      { food: SOUP, grams: 250, estimated: true },
    ]);
  });
});
