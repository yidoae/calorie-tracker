import assert from "node:assert/strict";
import { describe, it } from "node:test";
import fc from "fast-check";
import { buildPlan, calorieFloor, formulaPlan } from "../src/nutrition/plan.ts";
import { energyOf, MACRO_FIELDS, macroRange, TUNER_DAYS, tunedPlan, tunerDays, withCalories, withMacro } from "../src/nutrition/planTuning.ts";
import {
  DIET_STYLES,
  INTENSITY_RANGE,
  MEAL_PATTERNS,
  nutritionPlanSchema,
  PLAN_GOALS,
  planInputsSchema,
  STRENGTH_SPLITS,
  TRAINING_DAYS_RANGE,
  TRAINING_STYLES,
  type DayTargets,
  type PlanInputs,
} from "../src/schemas/plan.ts";
import { PROFILE_LIMITS } from "../src/schemas/profile.ts";

/*
 * Constitution III: every day of every plan stays at or above the sex-specific calorie floor, and
 * protein·4 + carbs·4 + fat·9 equals the day's calories within rounding. Checked here for any
 * valid wizard answers and any sequence of tuning moves (SC-006).
 */

/** Rounding each macro to whole grams can move the sum by up to 0.5·(4+4+9) = 8.5 kcal. */
const tolerance = (kcal: number) => Math.max(10, kcal * 0.01);

const range = (field: keyof typeof PROFILE_LIMITS) =>
  fc.double({ min: PROFILE_LIMITS[field].min, max: PROFILE_LIMITS[field].max, noNaN: true }).map((n) => Math.round(n * 10) / 10);

const planInputs: fc.Arbitrary<PlanInputs> = fc
  .record({
    sex: fc.constantFrom("male" as const, "female" as const),
    heightCm: range("heightCm"),
    weightKg: range("weightKg"),
    age: fc.integer({ min: PROFILE_LIMITS.age.min, max: PROFILE_LIMITS.age.max }),
    goal: fc.constantFrom(...PLAN_GOALS),
    intensityShare: fc.double({ min: 0, max: 1, noNaN: true }),
    trainingStyle: fc.constantFrom(...TRAINING_STYLES),
    split: fc.option(fc.constantFrom(...STRENGTH_SPLITS), { nil: null }),
    trainingDays: fc.uniqueArray(fc.integer({ min: 0, max: 6 }), { minLength: TRAINING_DAYS_RANGE.min, maxLength: TRAINING_DAYS_RANGE.max }),
    dietStyle: fc.constantFrom(...DIET_STYLES),
    fatPerKg: fc.double({ min: 1, max: 1.5, noNaN: true }),
    mealPattern: fc.constantFrom(...MEAL_PATTERNS),
    fastingWindowStart: fc.integer({ min: 6, max: 16 }),
    cycling: fc.boolean(),
  })
  .map(({ intensityShare, ...rest }) => {
    const r = rest.goal === "maintain" ? null : INTENSITY_RANGE[rest.goal];
    const intensity = r ? Math.round(r.min + (r.max - r.min) * intensityShare) : 0;
    return { ...rest, targetWeightKg: null, intensity, trainingDays: rest.trainingStyle === "sedentary" ? [] : rest.trainingDays };
  })
  .filter((i) => planInputsSchema.safeParse(i).success);

function assertDay(day: DayTargets, floor: number, label: string) {
  assert.ok(day.calories >= floor, `${label}: ${day.calories} kcal is below the floor ${floor}`);
  for (const field of MACRO_FIELDS) assert.ok(day[field] >= 0, `${label}: negative ${field}`);
  const diff = Math.abs(energyOf(day) - day.calories);
  assert.ok(diff <= tolerance(day.calories), `${label}: macros give ${energyOf(day)} kcal for a ${day.calories} kcal day`);
}

describe("plan engine invariants", () => {
  it("every day of a formula plan respects the floor and adds up", () => {
    fc.assert(
      fc.property(planInputs, (inputs) => {
        const plan = formulaPlan(inputs);
        const floor = calorieFloor(inputs.sex);
        assertDay(plan.base, floor, "base");
        if (plan.cycle) {
          assertDay(plan.cycle.training, floor, "training");
          assertDay(plan.cycle.rest, floor, "rest");
        }
      }),
      { numRuns: 2000 },
    );
  });

  it("the old failure case: cycling no longer pushes a rest day below 1200 kcal", () => {
    const plan = formulaPlan({
      sex: "female",
      heightCm: 155,
      weightKg: 50,
      age: 60,
      targetWeightKg: null,
      goal: "cut",
      intensity: 500,
      trainingStyle: "strength",
      split: "fullBody",
      trainingDays: [1, 3, 5, 6],
      dietStyle: "highProtein",
      fatPerKg: 1.2,
      mealPattern: "classic",
      fastingWindowStart: 12,
      cycling: true,
    });
    assert.ok(plan.cycle);
    assert.ok(plan.cycle.rest.calories >= 1200, `rest day is ${plan.cycle.rest.calories}`);
  });
});

const move = fc.oneof(
  fc.record({ kind: fc.constant("macro" as const), field: fc.constantFrom(...MACRO_FIELDS), grams: fc.integer({ min: 0, max: 700 }), lock: fc.boolean() }),
  fc.record({ kind: fc.constant("calories" as const), calories: fc.integer({ min: 0, max: 6000 }) }),
);

describe("tuning invariants", () => {
  it("any sequence of slider moves keeps every day at or above the floor and consistent", () => {
    fc.assert(
      fc.property(planInputs, fc.array(move, { maxLength: 12 }), (inputs, moves) => {
        const floor = calorieFloor(inputs.sex);
        let day = formulaPlan(inputs).base;
        for (const m of moves) {
          day = m.kind === "macro" ? withMacro(day, m.field, m.grams, m.lock, floor) : withCalories(day, m.calories, floor);
          assertDay(day, floor, m.kind === "macro" ? `${m.field} ${m.lock ? "locked" : "free"}` : "calories");
        }
      }),
      { numRuns: 1000 },
    );
  });

  // What the review screen can do: pick a day tab, move a slider within its range (macroRange),
  // with "Kalori sabit" on or off. The saved plan's base is then the weekly average when cycling.
  const uiMove = fc.record({
    day: fc.constantFrom(...TUNER_DAYS),
    field: fc.constantFrom(...MACRO_FIELDS, "calories" as const),
    share: fc.double({ min: 0, max: 1, noNaN: true }),
    lock: fc.boolean(),
  });

  it("any slider moves on the review screen give a plan whose every day, the weekly average included, holds", () => {
    fc.assert(
      fc.property(planInputs.map((i) => ({ ...i, cycling: true })), fc.array(uiMove, { maxLength: 16 }), (inputs, moves) => {
        const floor = calorieFloor(inputs.sex);
        const plan = buildPlan(inputs, { id: "p", createdAt: "2026-10-12T00:00:00.000Z" });
        const days = tunerDays(plan);
        for (const m of moves) {
          const day = plan.cycle ? m.day : "base";
          const r = macroRange(m.field, inputs.weightKg, floor);
          const value = r.min + Math.round(((r.max - r.min) * m.share) / r.step) * r.step;
          days[day] = m.field === "calories" ? withCalories(days[day], value, floor) : withMacro(days[day], m.field, value, m.lock, floor);
        }
        const tuned = tunedPlan(plan, days);
        assertDay(tuned.base, floor, "weekly average");
        if (tuned.cycle) {
          assertDay(tuned.cycle.training, floor, "training");
          assertDay(tuned.cycle.rest, floor, "rest");
        }
        assert.ok(nutritionPlanSchema.safeParse(tuned).success, "the tuned plan still parses");
      }),
      { numRuns: 1000 },
    );
  });
});
