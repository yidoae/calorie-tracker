import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { stepGrams } from "../src/components/meals/gramStep.ts";

describe("stepGrams", () => {
  it("snaps to the next ten in either direction", () => {
    assert.equal(stepGrams("150", 1), "160");
    assert.equal(stepGrams("150", -1), "140");
    assert.equal(stepGrams("62,5", 1), "70");
    assert.equal(stepGrams("62,5", -1), "60");
  });

  it("starts an empty or invalid field at 10 g and never goes below it", () => {
    assert.equal(stepGrams("", 1), "10");
    assert.equal(stepGrams("abc", -1), "10");
    assert.equal(stepGrams("10", -1), "10");
  });

  it("stops at the 5.000 g cap", () => {
    assert.equal(stepGrams("4995", 1), "5000");
    assert.equal(stepGrams("5000", 1), "5000");
  });
});
