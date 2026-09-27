import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { addMonths, dayKey, monthGrid, startOfMonth } from "./dates";

describe("dayKey", () => {
  test("formats the local date as zero-padded YYYY-MM-DD", () => {
    assert.equal(dayKey(new Date(2026, 0, 5)), "2026-01-05");
    assert.equal(dayKey(new Date(2026, 11, 31, 23, 59)), "2026-12-31");
  });
});

describe("startOfMonth", () => {
  test("returns local midnight on the 1st", () => {
    const d = startOfMonth(new Date(2026, 8, 27, 15, 30));
    assert.equal(d.getTime(), new Date(2026, 8, 1).getTime());
  });
});

describe("addMonths", () => {
  test("moves to the 1st of the target month, across years", () => {
    assert.equal(dayKey(addMonths(new Date(2026, 0, 31), 1)), "2026-02-01"); // no overflow into March
    assert.equal(dayKey(addMonths(new Date(2026, 11, 15), 1)), "2027-01-01");
    assert.equal(dayKey(addMonths(new Date(2026, 0, 15), -1)), "2025-12-01");
    assert.equal(dayKey(addMonths(new Date(2026, 4, 9), 0)), "2026-05-01");
  });
});

describe("monthGrid", () => {
  const keys = (month: Date) => monthGrid(month).map((d) => (d ? dayKey(d) : null));

  test("pads a Monday-first grid to whole weeks", () => {
    // September 2026 starts on a Tuesday and has 30 days.
    const grid = keys(new Date(2026, 8, 1));
    assert.equal(grid.length, 35);
    assert.equal(grid[0], null);
    assert.equal(grid[1], "2026-09-01");
    assert.equal(grid[30], "2026-09-30");
    assert.deepEqual(grid.slice(31), [null, null, null, null]);
  });

  test("needs no padding when the month starts on Monday and fills whole weeks", () => {
    // February 2021: starts Monday, 28 days.
    const grid = keys(new Date(2021, 1, 1));
    assert.equal(grid.length, 28);
    assert.equal(grid[0], "2021-02-01");
    assert.equal(grid[27], "2021-02-28");
  });

  test("puts a Sunday 1st in the last column and handles leap years", () => {
    // February 2032 starts on a Sunday and has 29 days.
    const grid = keys(new Date(2032, 1, 1));
    assert.deepEqual(grid.slice(0, 7), [null, null, null, null, null, null, "2032-02-01"]);
    assert.equal(grid.filter(Boolean).length, 29);
    assert.equal(grid.length % 7, 0);
  });

  test("every day lands in the column of its weekday", () => {
    monthGrid(new Date(2026, 8, 1)).forEach((d, i) => {
      if (d) assert.equal((d.getDay() + 6) % 7, i % 7);
    });
  });
});
