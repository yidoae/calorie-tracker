import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { monthBounds } from "../src/dates.ts";

describe("monthBounds", () => {
  it("spans the first to the last day of the month, whatever day it is given", () => {
    assert.deepEqual(monthBounds(new Date(2026, 9, 17)), { from: "2026-10-01", to: "2026-10-31" });
    assert.deepEqual(monthBounds(new Date(2026, 10, 1)), { from: "2026-11-01", to: "2026-11-30" });
  });

  it("knows February in leap and common years and the turn of the year", () => {
    assert.deepEqual(monthBounds(new Date(2028, 1, 10)), { from: "2028-02-01", to: "2028-02-29" });
    assert.deepEqual(monthBounds(new Date(2027, 1, 10)), { from: "2027-02-01", to: "2027-02-28" });
    assert.deepEqual(monthBounds(new Date(2026, 11, 31)), { from: "2026-12-01", to: "2026-12-31" });
  });
});
