import { assertEquals, assertThrows } from "jsr:@std/assert@1";
import { foodLines, systemInstruction } from "./prompt.ts";
import { responseSchema } from "./schema.ts";
import { AiUnavailable, type FoodRef } from "./types.ts";
import { validateAnswer } from "./validate.ts";

const foods: FoodRef[] = [
  { id: "egg", name: "Yumurta", typicalPortionG: 100 },
  { id: "simit", name: "Simit", typicalPortionG: 120 },
  { id: "tea", name: "Çay (şekersiz)", typicalPortionG: 100 },
];
const known = new Map(foods.map((f) => [f.id, f]));
const answer = (items: unknown[], unmatched: unknown[] = []) => JSON.stringify({ items, unmatched });

Deno.test("a clean answer passes as it is", () => {
  const r = validateAnswer(answer([{ food_id: "egg", grams: 100, estimated: false }], [{ description: "turşu" }]), known);
  assertEquals(r, { items: [{ food_id: "egg", grams: 100, estimated: false }], unmatched: [{ description: "turşu" }] });
});

Deno.test("an id outside the list becomes an unmatched description", () => {
  const r = validateAnswer(answer([{ food_id: "egg", grams: 50, estimated: true }, { food_id: "unicorn", grams: 80, estimated: true }]), known);
  assertEquals(r.items.length, 1);
  assertEquals(r.unmatched, [{ description: "unicorn", grams: 80 }]);
});

Deno.test("grams of 0 or less are dropped, over 5000 capped and marked estimated", () => {
  const r = validateAnswer(answer([{ food_id: "egg", grams: 0, estimated: false }, { food_id: "simit", grams: 9000, estimated: false }]), known);
  assertEquals(r.items, [{ food_id: "simit", grams: 5000, estimated: true }]);
});

Deno.test("the same food twice is one item with the summed grams", () => {
  const r = validateAnswer(answer([{ food_id: "egg", grams: 50, estimated: false }, { food_id: "egg", grams: 60, estimated: true }]), known);
  assertEquals(r.items, [{ food_id: "egg", grams: 110, estimated: true }]);
});

Deno.test("at most 30 items", () => {
  const many = Array.from({ length: 40 }, (_, i) => ({ food_id: i % 2 ? "egg" : "simit", grams: 1, estimated: true }));
  const ids = new Map(Array.from({ length: 40 }, (_, i) => [`f${i}`, { id: `f${i}`, name: `F${i}`, typicalPortionG: 10 }]));
  assertEquals(validateAnswer(answer(many.map((m, i) => ({ ...m, food_id: `f${i}` }))), ids).items.length, 30);
});

Deno.test("grams are rounded to one decimal", () => {
  assertEquals(validateAnswer(answer([{ food_id: "tea", grams: 199.96, estimated: true }]), known).items[0].grams, 200);
});

Deno.test("unreadable output is an unavailable model", () => {
  assertThrows(() => validateAnswer("not json", known), AiUnavailable);
  assertThrows(() => validateAnswer(JSON.stringify({ items: "x" }), known), AiUnavailable);
});

Deno.test("no food at all is an empty result", () => {
  assertEquals(validateAnswer(answer([], [{ description: "duvar" }]), known).items, []);
});

Deno.test("the prompt lists every food and the schema enum is the same id set", () => {
  assertEquals(foodLines(foods).split("\n"), ["egg · Yumurta · 100 g", "simit · Simit · 120 g", "tea · Çay (şekersiz) · 100 g"]);
  assertEquals(systemInstruction("text", foods).includes("simit · Simit · 120 g"), true);
  assertEquals(responseSchema(foods).properties.items.items.properties.food_id.enum, ["egg", "simit", "tea"]);
});
