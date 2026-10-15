import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { reviewHtml } from "../src/emit/review.ts";
import { summaryText } from "../src/emit/summary.ts";
import type { ResolvedFood } from "../src/rules.ts";

const egg: ResolvedFood = {
  id: "egg",
  name: "Yumurta",
  category: "egg",
  sourceKind: "usda",
  sourceRef: "fdc:171287",
  per100: { kcal: 143, protein: 12.56, carbs: 0.72, fat: 9.51, alcohol: 0 },
  typicalPortionG: 50,
  portions: [{ unit: "adet", grams: 50 }],
  aliases: ["yumurta"],
};
const soup: ResolvedFood = {
  ...egg,
  id: "lentil_soup",
  name: "Mercimek <çorbası>",
  category: "dish",
  sourceKind: "recipe",
  sourceRef: "recipe:lentil_soup",
  per100: { kcal: 58.4, protein: 2.9, carbs: 9, fat: 1.4, alcohol: 0 },
  portions: [],
  aliases: ["mercimek çorbası"],
  recipe: { ingredients: [{ foodId: "egg", grams: 200 }], waterG: 1400, cookedG: 1935, yieldNote: "FNDDS 41603010, moisture 0 %" },
};

describe("summary", () => {
  it("prints one line per food, sorted, with recipe details indented", () => {
    const text = summaryText([soup, egg]);
    const lines = text.split("\n");
    assert.equal(lines[0], "egg | Yumurta | egg | fdc:171287 | 143.00 kcal P12.56 C0.72 F9.51 A0.00 | typ 50.0 g | adet 50.0 g");
    assert.match(text, /^lentil_soup \| Mercimek <çorbası> \| dish \| recipe:lentil_soup \| 58\.40 kcal/m);
    assert.match(text, /^ {4}egg 200\.0 g$/m);
    assert.match(text, /^ {4}water 1400\.0 g → cooked 1935\.0 g \(FNDDS 41603010, moisture 0 %\)$/m);
  });

  it("is byte-identical for the same input in any order", () => {
    assert.equal(summaryText([egg, soup]), summaryText([soup, egg]));
  });
});

describe("review page", () => {
  const previous = "egg | Yumurta | egg | fdc:171287 | 140.00 kcal P12.56 C0.72 F9.51 A0.00 | typ 50.0 g | adet 50.0 g\n";
  const html = reviewHtml([egg, soup], previous);

  it("lists every food in one self-contained file", () => {
    assert.match(html, /data-id="egg"/);
    assert.match(html, /data-id="lentil_soup"/);
    assert.doesNotMatch(html, /<script[^>]+src=|<link[^>]+href=/);
  });

  it("escapes HTML in names", () => {
    assert.match(html, /Mercimek &lt;çorbası&gt;/);
    assert.doesNotMatch(html, /Mercimek <çorbası>/);
  });

  it("has a search box and category and source filters", () => {
    assert.match(html, /<input[^>]+id="q"/);
    assert.match(html, /<select[^>]+id="category"/);
    assert.match(html, /<select[^>]+id="source"/);
    assert.match(html, /<option value="dish">/);
    assert.match(html, /<option value="recipe">/);
  });

  it("shows a recipe's ingredients, water and cooked weight", () => {
    assert.match(html, /1935\.0 g/);
    assert.match(html, /FNDDS 41603010/);
  });

  it("marks foods whose summary line changed since the committed summary", () => {
    assert.match(html, /data-id="egg"[^>]*data-changed="1"/);
    assert.match(html, /data-id="lentil_soup"[^>]*data-changed="1"/);
    assert.doesNotMatch(reviewHtml([egg], summaryText([egg])), /data-changed="1"/);
  });
});
