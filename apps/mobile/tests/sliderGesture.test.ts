import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dragIntent, stepValue, valueAt } from "../src/components/ui/sliderGesture.ts";

describe("valueAt", () => {
  it("maps a point on the track to a value snapped to the step", () => {
    assert.equal(valueAt(150, 300, 0, 600, 5), 300);
    assert.equal(valueAt(151, 300, 0, 600, 5), 300);
    assert.equal(valueAt(152, 300, 0, 600, 5), 305);
  });

  it("clamps points beyond either end (the finger left the track)", () => {
    assert.equal(valueAt(-80, 300, 300, 800, 50), 300);
    assert.equal(valueAt(900, 300, 300, 800, 50), 800);
  });

  it("keeps decimal steps exact and survives a zero width", () => {
    assert.equal(valueAt(120, 200, 1, 1.5, 0.05), 1.3);
    assert.equal(valueAt(10, 0, 6, 16, 1), 6);
  });
});

describe("stepValue", () => {
  it("moves one step and stops at the ends (screen reader increment/decrement)", () => {
    assert.equal(stepValue(1.2, 1, 1, 1.5, 0.05), 1.25);
    assert.equal(stepValue(800, 1, 300, 800, 50), 800);
    assert.equal(stepValue(300, -1, 300, 800, 50), 300);
  });
});

describe("dragIntent", () => {
  it("waits while the finger has barely moved", () => {
    assert.equal(dragIntent(3, 2), "undecided");
    assert.equal(dragIntent(-4, -4), "undecided");
  });

  it("is a slide when the move is clearly horizontal", () => {
    assert.equal(dragIntent(12, 3), "slide");
    assert.equal(dragIntent(-15, 5), "slide");
  });

  it("is a scroll when the move is vertical or diagonal, so the screen keeps scrolling", () => {
    assert.equal(dragIntent(2, 14), "scroll");
    assert.equal(dragIntent(10, 10), "scroll");
    assert.equal(dragIntent(-3, -20), "scroll");
  });
});
