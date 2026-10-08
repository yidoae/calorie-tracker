import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formulaPlan } from "@/lib/nutrition/plan";
import { shiftDay } from "@/lib/dates";
import { defaultPlanTitle, findOverlap, firstFreeDay, lastSelectableEnd, periodOn, periodStatus, pickDay, planOn, removePeriod, upsertPeriod } from "@/lib/nutrition/schedule";
import type { NutritionPlan, PlanInputs, PlanPeriod } from "@/types/plan";
import { parseSettings } from "@/types/settings";

const inputs: PlanInputs = {
  sex: "male",
  heightCm: 180,
  weightKg: 80,
  age: 30,
  targetWeightKg: null,
  goal: "maintain",
  intensity: 0,
  trainingStyle: "strength",
  split: "upperLower",
  trainingDays: [0, 1, 3, 4],
  dietStyle: "highProtein",
  fatPerKg: 1.2,
  mealPattern: "classic",
  fastingWindowStart: 12,
  cycling: false,
};

function planFor(id: string, goal: PlanInputs["goal"]): NutritionPlan {
  const i = { ...inputs, goal, intensity: goal === "cut" ? 500 : goal === "bulk" ? 250 : 0 };
  const r = formulaPlan(i);
  return { id, createdAt: "2026-10-01T00:00:00.000Z", inputs: i, source: "formula", bmr: r.bmr, tdee: r.tdee, base: r.base, cycle: r.cycle, strategySummary: "" };
}

const main = planFor("main", "maintain");
const cut: PlanPeriod = { id: "cut", title: "Cut", start: "2026-11-01", end: "2026-12-15", plan: planFor("p-cut", "cut") };
const bulk: PlanPeriod = { id: "bulk", title: "Bulk", start: "2027-01-01", end: "2027-03-31", plan: planFor("p-bulk", "bulk") };

describe("plan periods: which plan applies on a date", () => {
  const schedule = { nutritionPlan: main, planPeriods: [cut, bulk] };

  it("a date inside a period uses that period's plan, both ends included", () => {
    assert.equal(planOn(schedule, new Date(2026, 10, 1))?.id, "p-cut");
    assert.equal(planOn(schedule, new Date(2026, 11, 15, 23, 59))?.id, "p-cut");
    assert.equal(planOn(schedule, new Date(2027, 1, 10))?.id, "p-bulk");
  });

  it("days outside every period fall back to the main plan", () => {
    assert.equal(planOn(schedule, new Date(2026, 9, 31))?.id, "main");
    assert.equal(planOn(schedule, new Date(2026, 11, 20))?.id, "main");
    assert.equal(periodOn([cut, bulk], "2026-12-20"), null);
  });

  it("no main plan and no period: null", () => {
    assert.equal(planOn({ nutritionPlan: null, planPeriods: [cut] }, new Date(2026, 0, 1)), null);
  });

  it("status: active, upcoming or past relative to today", () => {
    assert.equal(periodStatus(cut, "2026-11-10"), "active");
    assert.equal(periodStatus(cut, "2026-10-08"), "upcoming");
    assert.equal(periodStatus(cut, "2026-12-16"), "past");
  });
});

describe("plan periods: editing", () => {
  it("finds an overlapping period, ignoring the one being edited", () => {
    assert.equal(findOverlap([cut, bulk], { start: "2026-12-10", end: "2026-12-31" })?.id, "cut");
    assert.equal(findOverlap([cut, bulk], { start: "2026-12-16", end: "2026-12-31" }), null);
    assert.equal(findOverlap([cut, bulk], { start: "2026-10-01", end: "2027-06-01" })?.id, "cut");
    assert.equal(findOverlap([cut, bulk], { start: "2026-11-05", end: "2026-12-20" }, "cut"), null);
  });

  it("upsert adds or replaces by id and keeps the list in date order", () => {
    const added = upsertPeriod([bulk], cut);
    assert.deepEqual(added.map((p) => p.id), ["cut", "bulk"]);
    const moved = upsertPeriod(added, { ...cut, title: "Mini cut", start: "2027-04-01", end: "2027-04-30" });
    assert.deepEqual(moved.map((p) => `${p.id}:${p.title}`), ["bulk:Bulk", "cut:Mini cut"]);
  });

  it("remove drops the period by id", () => {
    assert.deepEqual(removePeriod([cut, bulk], "cut").map((p) => p.id), ["bulk"]);
  });

  it("default titles follow the goal", () => {
    assert.equal(defaultPlanTitle("cut"), "Cut");
    assert.equal(defaultPlanTitle("bulk"), "Bulk");
    assert.equal(defaultPlanTitle("maintain"), "Koruma");
  });
});

describe("parseSettings: plan periods", () => {
  it("old settings without periods read as an empty list", () => {
    const s = parseSettings({ nutritionPlan: main });
    assert.deepEqual(s.planPeriods, []);
    assert.equal(s.mainPlanTitle, null);
    assert.equal(s.nutritionPlan?.id, "main");
  });

  it("keeps valid periods sorted by start date", () => {
    const s = parseSettings({ planPeriods: [bulk, cut], mainPlanTitle: "Koruma" });
    assert.deepEqual(s.planPeriods.map((p) => p.id), ["cut", "bulk"]);
    assert.equal(s.mainPlanTitle, "Koruma");
  });

  it("drops broken periods, reversed ranges and overlaps (the earlier one wins)", () => {
    const reversed = { ...bulk, id: "rev", start: "2027-05-10", end: "2027-05-01" };
    const overlapping = { ...bulk, id: "late", start: "2026-12-01", end: "2026-12-31" };
    const badDate = { ...bulk, id: "bad", start: "2027-13-01", end: "2027-13-05" };
    const s = parseSettings({ planPeriods: [cut, overlapping, reversed, badDate, { id: "x" }] });
    assert.deepEqual(s.planPeriods.map((p) => p.id), ["cut"]);
  });

  it("blank or too long titles are rejected", () => {
    const s = parseSettings({ planPeriods: [{ ...cut, title: "   " }, { ...bulk, title: "x".repeat(41) }] });
    assert.deepEqual(s.planPeriods, []);
  });
});

describe("range picking on the calendar", () => {
  const empty = { start: null, end: null };

  it("first click starts a range, second click closes it", () => {
    const a = pickDay(empty, "2027-04-10", [cut, bulk]);
    assert.deepEqual(a, { start: "2027-04-10", end: null });
    assert.deepEqual(pickDay(a, "2027-05-01", [cut, bulk]), { start: "2027-04-10", end: "2027-05-01" });
  });

  it("clicking before the start moves the start; a click after a full range starts over", () => {
    const a = { start: "2027-04-10", end: null };
    assert.deepEqual(pickDay(a, "2027-04-02", []), { start: "2027-04-02", end: null });
    assert.deepEqual(pickDay({ start: "2027-04-10", end: "2027-04-20" }, "2027-06-01", []), { start: "2027-06-01", end: null });
  });

  it("a one-day period is allowed", () => {
    assert.deepEqual(pickDay({ start: "2027-04-10", end: null }, "2027-04-10", []), { start: "2027-04-10", end: "2027-04-10" });
  });

  it("days of other periods can't be picked, and a range can't jump over one", () => {
    assert.deepEqual(pickDay(empty, "2026-11-20", [cut]), empty);
    assert.equal(lastSelectableEnd("2026-10-01", [cut, bulk]), "2026-10-31");
    assert.equal(lastSelectableEnd("2026-12-16", [cut, bulk]), "2026-12-31");
    assert.equal(lastSelectableEnd("2027-04-01", [cut, bulk]), null);
    // Past the limit the click restarts the range instead of swallowing the Cut.
    assert.deepEqual(pickDay({ start: "2026-10-01", end: null }, "2027-01-10", [cut]), { start: "2027-01-10", end: null });
  });

  it("the period being edited doesn't block itself", () => {
    assert.deepEqual(pickDay(empty, "2026-11-20", [cut], "cut"), { start: "2026-11-20", end: null });
    assert.equal(lastSelectableEnd("2026-11-20", [cut, bulk], "cut"), "2026-12-31");
  });

  it("the calendar opens on the first free day", () => {
    assert.equal(firstFreeDay("2026-10-08", [cut, bulk]), "2026-10-08");
    assert.equal(firstFreeDay("2026-11-10", [cut, bulk]), "2026-12-16");
    const adjacent = { ...bulk, id: "adj", start: "2026-12-16", end: "2026-12-31" };
    assert.equal(firstFreeDay("2026-11-10", [cut, adjacent, bulk]), "2027-04-01");
  });

  it("shiftDay crosses month, year and DST boundaries", () => {
    assert.equal(shiftDay("2026-10-31", 1), "2026-11-01");
    assert.equal(shiftDay("2027-01-01", -1), "2026-12-31");
    assert.equal(shiftDay("2026-03-29", 1), "2026-03-30");
  });
});
