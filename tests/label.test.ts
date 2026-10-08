import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { kcalFromMacros, missingFields, parseNutritionLabel } from "@/lib/nutrition/labelParse";
import { parseGrams } from "@/lib/nutrition/macros";

describe("nutrition label parser", () => {
  it("reads a Turkish protein bar label (100 g column first)", () => {
    const text = `Besin Değerleri 100 g Porsiyon (60 g) %RBA*
Enerji 1.570 kJ / 375 kcal 942 kJ / 225 kcal 11%
Yağ 12 g 7,2 g 10%
 Doymuş Yağ 6,5 g 3,9 g 20%
Karbonhidrat 30 g 18 g 7%
 Şekerler 3,2 g 1,9 g 2%
Lif 8,1 g 4,9 g
Protein 33 g 20 g 40%
Tuz 0,45 g 0,27 g 5%`;
    const v = parseNutritionLabel(text);
    assert.deepEqual(v, {
      calories: 375,
      fat: 12,
      satFat: 6.5,
      carbs: 30,
      sugar: 3.2,
      fiber: 8.1,
      protein: 33,
      sodium: 180,
      servingGrams: 60,
    });
    assert.deepEqual(missingFields(v), []);
  });

  it("tolerates OCR slips (no diacritics, kJ only, '<0,5')", () => {
    const v = parseNutritionLabel(`Enerji 2100 kJ
Yag 30 g
bunun doymus yag 10 g
Karbonhidrat 55,5 g
sekerler <0,5 g
Protein 8 g`);
    assert.equal(v.calories, 502);
    assert.equal(v.fat, 30);
    assert.equal(v.satFat, 10);
    assert.equal(v.carbs, 55.5);
    assert.equal(v.sugar, 0);
    assert.equal(v.protein, 8);
    assert.equal(v.fiber, null);
    assert.equal(v.sodium, null);
    assert.equal(v.servingGrams, null);
  });

  it("reads an English label with the energy split from its row", () => {
    const v = parseNutritionLabel(`Nutrition per 100g
Energy
1680 kJ / 400 kcal
Fat 15g
of which saturates 3g
Carbohydrate 40g
of which sugars 20g
Fibre 5g
Protein 25g
Salt 1,2g`);
    assert.equal(v.calories, 400);
    assert.equal(v.satFat, 3);
    assert.equal(v.sugar, 20);
    assert.equal(v.fiber, 5);
    assert.equal(v.sodium, 480);
  });

  it("drops impossible values instead of guessing", () => {
    const v = parseNutritionLabel("Protein 125 g\nYağ 4 g\nDoymuş yağ 9 g");
    assert.equal(v.protein, null);
    assert.equal(v.satFat, null);
    assert.equal(v.fat, 4);
  });

  it("computes kcal from macros only when all three are known", () => {
    assert.equal(kcalFromMacros({ protein: 33, carbs: 30, fat: 12 }), 360);
    assert.equal(kcalFromMacros({ protein: 33, carbs: null, fat: 12 }), null);
  });
});

describe("parseGrams", () => {
  it("accepts typed grams with a comma or dot", () => {
    assert.equal(parseGrams("150"), 150);
    assert.equal(parseGrams("62,5"), 62.5);
    assert.equal(parseGrams(" 40.5 "), 40.5);
  });
  it("rejects empty, zero and absurd amounts", () => {
    assert.equal(parseGrams(""), null);
    assert.equal(parseGrams("0"), null);
    assert.equal(parseGrams("abc"), null);
    assert.equal(parseGrams("6000"), null);
  });
});
