import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseGrams } from "../src/nutrition/macros.ts";

describe("parseGrams", () => {
  it("reads whole and decimal grams with a comma or a dot", () => {
    assert.equal(parseGrams("150"), 150);
    assert.equal(parseGrams(" 62,5 "), 62.5);
    assert.equal(parseGrams("5000"), 5000);
  });

  it("refuses empty, non-numeric and out-of-range text", () => {
    for (const text of ["", "abc", "-5", "0", "5000,1"]) assert.equal(parseGrams(text), null, text);
  });

  it("refuses an amount that rounds to 0 g (the server refuses it too)", () => {
    assert.equal(parseGrams("0,04"), null);
    assert.equal(parseGrams("0,05"), 0.1);
  });
});
