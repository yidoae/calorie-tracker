import assert from "node:assert/strict";
import { test } from "node:test";
import { parseMeal } from "../src/text/parseMeal.ts";

// The portion unit labels of the food list (002); the app passes them in.
const UNITS = ["adet", "dilim", "kase", "su bardağı", "yemek kaşığı", "çay kaşığı", "porsiyon", "tabak", "avuç", "kutu", "şiş", "şişe", "bardak", "kadeh", "dürüm"];
const one = (text: string) => {
  const parsed = parseMeal(text, UNITS);
  assert.equal(parsed.length, 1, `one phrase in "${text}"`);
  return parsed[0];
};
const brief = (text: string) => parseMeal(text, UNITS).map((p) => [p.query, p.amount, p.unit, p.unitKind]);

test("splits on commas, ve, ile, plus and new lines", () => {
  assert.deepEqual(brief("2 yumurta, yarım simit ve çay\nbeyaz peynir + domates ile salatalık"), [
    ["yumurta", 2, null, null],
    ["simit", 0.5, null, null],
    ["çay", null, null, null],
    ["beyaz peynir", null, null, null],
    ["domates", null, null, null],
    ["salatalık", null, null, null],
  ]);
});

test("digits with a decimal comma or point", () => {
  assert.equal(one("1,5 kase yoğurt").amount, 1.5);
  assert.equal(one("2.5 dilim ekmek").amount, 2.5);
});

test("Turkish number words", () => {
  assert.equal(one("bir kase mercimek çorbası").amount, 1);
  assert.equal(one("üç köfte").amount, 3);
  assert.equal(one("on iki zeytin").amount, 12);
  assert.equal(one("iki yüz gram tavuk göğsü").amount, 200);
  assert.equal(one("yüz elli gram pilav").amount, 150);
  assert.equal(one("dokuz yüz gram karpuz").amount, 900);
  assert.equal(one("bir buçuk dilim ekmek").amount, 1.5);
  assert.equal(one("yarım ekmek").amount, 0.5);
  assert.equal(one("çeyrek ekmek").amount, 0.25);
  assert.equal(one("iki buçuk kase pilav").amount, 2.5);
});

test("grams: g, gr, gram and kg, attached or apart", () => {
  for (const t of ["200 g tavuk", "200g tavuk", "200 gr tavuk", "200gr tavuk", "200 gram tavuk", "tavuk 200 gram", "0,2 kg tavuk"]) {
    const p = one(t);
    assert.deepEqual([p.query, p.amount, p.unitKind], ["tavuk", 200, "gram"], t);
  }
});

test("portion units, also with suffixes and two words", () => {
  assert.deepEqual(brief("2 dilim beyaz peynir"), [["beyaz peynir", 2, "dilim", "portion"]]);
  assert.deepEqual(brief("iki dilimi ekmek"), [["ekmek", 2, "dilim", "portion"]]);
  assert.deepEqual(brief("1 su bardağı süt"), [["süt", 1, "su bardağı", "portion"]]);
  assert.deepEqual(brief("3 yemek kaşığı yoğurt"), [["yoğurt", 3, "yemek kaşığı", "portion"]]);
  assert.deepEqual(brief("bir kasesi çorba"), [["çorba", 1, "kase", "portion"]]);
  assert.deepEqual(brief("yarım tabağı pilav"), [["pilav", 0.5, "tabak", "portion"]]);
  assert.deepEqual(brief("2 tane yumurta"), [["yumurta", 2, "adet", "portion"]]);
  assert.deepEqual(brief("1 kaşık bal"), [["bal", 1, "yemek kaşığı", "portion"]]);
});

test("an exact unit beats a shorter one it starts with", () => {
  assert.deepEqual(brief("bir şişe su"), [["su", 1, "şişe", "portion"]]);
});

test("a unit word alone is the food", () => {
  assert.deepEqual(brief("1 dürüm"), [["dürüm", 1, null, null]]);
});

test("negation words stay out of the query and are kept", () => {
  const p = one("şekersiz çay");
  assert.deepEqual([p.query, p.negated], ["çay", ["şekersiz"]]);
  assert.deepEqual(one("1 kase yağsız yoğurt").negated, ["yağsız"]);
  assert.deepEqual(one("tuzsuz tereyağı").negated, ["tuzsuz"]);
  assert.deepEqual(one("sütsüz kahve").negated, ["sütsüz"]);
});

test("a phrase without an amount, and empty phrases", () => {
  assert.deepEqual(brief("mercimek çorbası"), [["mercimek çorbası", null, null, null]]);
  assert.deepEqual(brief(" , ve , "), []);
  assert.deepEqual(brief("2"), []);
});

test("the phrase keeps the user's own words", () => {
  assert.equal(one("  İki Yumurta ").phrase, "İki Yumurta");
});

test("a 300-character text parses", () => {
  const text = Array.from({ length: 30 }, () => "1 elma").join(", ").slice(0, 300);
  assert.ok(parseMeal(text, UNITS).length >= 30);
});
