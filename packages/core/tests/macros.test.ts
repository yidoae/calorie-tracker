import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseGrams, progressOf } from "../src/nutrition/macros.ts";

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

describe("progressOf", () => {
  it("the eaten share of the goal, held to 0–1; 0 without a goal", () => {
    assert.deepEqual([progressOf(50, 200), progressOf(300, 200), progressOf(-5, 200), progressOf(50, 0)], [0.25, 1, 0, 0]);
  });
});
