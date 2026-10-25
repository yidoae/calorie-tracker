import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { NutritionPlan } from "@calorie/core/schemas/plan";
import { calendarDays, canGoForward, dayLabel, dayTitle, isOpenableDay, kcalByDay, monthTitle, planOnDay, shiftDay } from "../src/hooks/historyLogic.ts";

const TZ = "Europe/Istanbul";

/** A plan with a flat calorie target, saved at `createdAt` (UTC). */
function plan(id: string, createdAt: string, calories: number): NutritionPlan {
  return {
    id,
    createdAt,
    inputs: {
      sex: "female",
      heightCm: 165,
      weightKg: 70,
      age: 30,
      targetWeightKg: 62,
      goal: "cut",
      intensity: 500,
      trainingStyle: "sedentary",
      split: null,
      trainingDays: [],
      dietStyle: "iifym",
      fatPerKg: 1,
      mealPattern: "classic",
      fastingWindowStart: 12,
      cycling: false,
    },
    bmr: 1400,
    tdee: 1900,
    base: { calories, protein: 100, carbs: 200, fat: 60 },
    cycle: null,
    strategySummary: "",
  };
}

const FIRST = plan("p1", "2026-10-01T06:00:00Z", 2000);
// 01:30 on 12 October in Istanbul, still 11 October in UTC.
const SECOND = plan("p2", "2026-10-11T22:30:00Z", 1600);

describe("kcalByDay", () => {
  it("adds up the meals of each day", () => {
    const sums = kcalByDay([
      { localDate: "2026-10-03", calories: 500 },
      { localDate: "2026-10-03", calories: 1450.5 },
      { localDate: "2026-10-04", calories: 300 },
    ]);
    assert.deepEqual([...sums], [["2026-10-03", 1950.5], ["2026-10-04", 300]]);
  });
});

describe("planOnDay", () => {
  it("is the last plan saved by the end of that local day, whatever order the plans come in", () => {
    assert.equal(planOnDay([SECOND, FIRST], "2026-10-05", TZ)?.id, "p1");
    assert.equal(planOnDay([SECOND, FIRST], "2026-10-12", TZ)?.id, "p2");
    assert.equal(planOnDay([SECOND, FIRST], "2026-10-20", TZ)?.id, "p2");
  });

  it("uses the user's local day of the save, not the UTC day", () => {
    assert.equal(planOnDay([FIRST, SECOND], "2026-10-11", TZ)?.id, "p1");
    assert.equal(planOnDay([FIRST, SECOND], "2026-10-11", "UTC")?.id, "p2");
  });

  it("falls back to the first plan before any was saved, and to none without plans", () => {
    assert.equal(planOnDay([SECOND, FIRST], "2026-09-30", TZ)?.id, "p1");
    assert.equal(planOnDay([], "2026-10-05", TZ), null);
  });
});

describe("calendarDays", () => {
  const october = new Date(2026, 9, 1);
  const rows = [
    { localDate: "2026-10-05", calories: 2050 }, // 2000 target: +2.5 %
    { localDate: "2026-10-11", calories: 1600 }, // 2000 target (p2 is from the 12th): under
    { localDate: "2026-10-12", calories: 1600 }, // 1600 target: on target
    { localDate: "2026-10-13", calories: 1700 }, // 1600 target: +6.25 %
  ];
  const cells = calendarDays(october, rows, [FIRST, SECOND], "2026-10-13", TZ);
  const day = (n: number) => cells.find((c) => c?.day === n);

  it("lays the month out Monday first: 1 October 2026 is a Thursday", () => {
    assert.equal(cells.length % 7, 0);
    assert.deepEqual(cells.slice(0, 4).map((c) => c?.day ?? null), [null, null, null, 1]);
    assert.equal(cells.filter(Boolean).length, 31);
  });

  it("rates each logged day against that day's own target, within ±5 %", () => {
    assert.equal(day(5)?.rating, "onTarget");
    assert.equal(day(11)?.rating, "under");
    assert.equal(day(12)?.rating, "onTarget");
    assert.equal(day(13)?.rating, "over");
  });

  it("leaves days without meals unmarked and marks today and the days after it", () => {
    assert.equal(day(6)?.rating, null);
    assert.deepEqual([day(13)?.isToday, day(13)?.isFuture], [true, false]);
    assert.deepEqual([day(14)?.isToday, day(14)?.isFuture], [false, true]);
    assert.equal(day(14)?.localDate, "2026-10-14");
  });
});

describe("month navigation and titles", () => {
  it("goes forward only up to the current month", () => {
    assert.equal(canGoForward(new Date(2026, 8, 1), "2026-10-13"), true);
    assert.equal(canGoForward(new Date(2026, 9, 1), "2026-10-13"), false);
    assert.equal(canGoForward(new Date(2025, 11, 1), "2026-01-02"), true);
  });

  it("names months and days in Turkish", () => {
    assert.equal(monthTitle(new Date(2026, 9, 1)), "Ekim 2026");
    assert.equal(dayTitle("2026-10-12"), "12 Ekim Pazartesi");
    assert.equal(dayTitle("2026-03-01"), "1 Mart Pazar");
  });

  it("opens only real days up to today", () => {
    assert.equal(isOpenableDay("2026-10-13", "2026-10-13"), true);
    assert.equal(isOpenableDay("2026-02-28", "2026-10-13"), true);
    assert.equal(isOpenableDay("2026-10-14", "2026-10-13"), false);
    assert.equal(isOpenableDay("2026-02-30", "2026-10-13"), false);
    assert.equal(isOpenableDay("bugün", "2026-10-13"), false);
    assert.equal(isOpenableDay(undefined, "2026-10-13"), false);
  });
});

describe("day switcher on Bugün", () => {
  it("steps a day back or forward across months and years, never past today", () => {
    assert.equal(shiftDay("2026-10-01", -1, "2026-10-25"), "2026-09-30");
    assert.equal(shiftDay("2026-01-01", -1, "2026-10-25"), "2025-12-31");
    assert.equal(shiftDay("2026-10-24", 1, "2026-10-25"), "2026-10-25");
    assert.equal(shiftDay("2026-10-25", 1, "2026-10-25"), "2026-10-25");
  });

  it("names today and yesterday, other days by date", () => {
    assert.equal(dayLabel("2026-10-25", "2026-10-25"), "Bugün");
    assert.equal(dayLabel("2026-10-24", "2026-10-25"), "Dün");
    assert.equal(dayLabel("2026-10-11", "2026-10-25"), dayTitle("2026-10-11"));
  });
});
