import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PlanInputs } from "@calorie/core/schemas/plan";
import type { Profile } from "@calorie/core/schemas/rows";
import {
  canGoTo,
  checkWizard,
  deficitNotice,
  fastingNotice,
  gentlerIntensity,
  initialWizardForm,
  toggleTrainingDay,
  WIZARD_STEPS,
  withFrequency,
  withGoal,
  withTrainingStyle,
  wizardPreview,
  type WizardForm,
} from "../src/hooks/planWizardLogic.ts";

const YEAR = 2026;

const profile: Profile = {
  id: "00000000-0000-4000-8000-000000000001",
  sex: "female",
  birthYear: 1996,
  heightCm: 165,
  weightKg: 70.5,
  goalWeightKg: 62,
  activityLevel: "moderate",
  dietStyle: "highProtein",
  fatPerKg: 1.2,
  timeZone: "Europe/Istanbul",
  onboardingCompleted: true,
  sensitiveWarningAck: false,
};

const previous: PlanInputs = {
  sex: "female",
  heightCm: 165,
  weightKg: 70,
  age: 30,
  targetWeightKg: 62,
  goal: "cut",
  intensity: 500,
  trainingStyle: "strength",
  split: "upperLower",
  trainingDays: [0, 1, 3, 4],
  dietStyle: "highProtein",
  fatPerKg: 1.2,
  mealPattern: "classic",
  fastingWindowStart: 12,
  cycling: false,
};

const form = (patch: Partial<WizardForm> = {}): WizardForm => ({ ...initialWizardForm(previous, profile, YEAR), ...patch });

describe("initialWizardForm", () => {
  it("starts from the active plan's answers, numbers as typed text with a decimal comma", () => {
    const f = initialWizardForm({ ...previous, weightKg: 70.5 }, profile, YEAR);
    assert.equal(f.weightKg, "70,5");
    assert.equal(f.heightCm, "165");
    assert.equal(f.age, "30");
    assert.equal(f.targetWeightKg, "62");
    assert.deepEqual(f.trainingDays, [0, 1, 3, 4]);
  });

  it("without a plan, starts from the setup answers in the profile", () => {
    const f = initialWizardForm(null, profile, YEAR);
    assert.equal(f.sex, "female");
    assert.equal(f.age, "30");
    assert.equal(f.weightKg, "70,5");
    assert.equal(f.targetWeightKg, "62");
    assert.equal(f.goal, "cut");
    assert.equal(f.intensity, 500);
    assert.equal(f.dietStyle, "highProtein");
  });

  it("always takes the sex from the profile: save_plan refuses any other (the floor follows it)", () => {
    assert.equal(initialWizardForm({ ...previous, sex: "male" }, profile, YEAR).sex, "female");
  });
});

describe("checkWizard", () => {
  it("valid answers parse into plan inputs and every step is valid", () => {
    const c = checkWizard(form());
    assert.deepEqual(c.inputs, previous);
    assert.deepEqual(c.stepValid, [true, true, true, true]);
  });

  it("explains out-of-range body values in Turkish and blocks the first step", () => {
    const c = checkWizard(form({ heightCm: "300", age: "" }));
    assert.equal(c.errors.heightCm, "Boy 100–250 cm arasında olmalı.");
    assert.equal(c.errors.age, "Yaşını yaz.");
    assert.equal(c.stepValid[0], false);
    assert.equal(c.inputs, null);
  });

  it("the goal weight is optional but must point the way of the goal", () => {
    assert.equal(checkWizard(form({ targetWeightKg: "" })).inputs?.targetWeightKg, null);
    const wrong = checkWizard(form({ targetWeightKg: "75" }));
    assert.equal(wrong.errors.targetDirection, "Yağ yakımı için hedef kilon şu anki kilondan düşük olmalı.");
    assert.equal(wrong.stepValid[0], false);
    const bulk = checkWizard(withGoal(form({ targetWeightKg: "65" }), "bulk"));
    assert.equal(bulk.errors.targetDirection, "Kas kazanımı için hedef kilon şu anki kilondan yüksek olmalı.");
  });

  it("a training routine needs 2–6 days; a sedentary one none", () => {
    const one = checkWizard(form({ trainingDays: [2] }));
    assert.equal(one.errors.trainingDays, "Haftada 2–6 gün seç.");
    assert.deepEqual(one.stepValid, [true, false, true, true]);
    assert.equal(checkWizard(withTrainingStyle(form(), "sedentary")).errors.trainingDays, null);
  });
});

describe("form changes", () => {
  it("changing the goal resets the deficit or surplus to its default", () => {
    assert.equal(withGoal(form(), "bulk").intensity, 250);
    assert.equal(withGoal(form(), "maintain").intensity, 0);
    assert.equal(withGoal(form({ intensity: 700 }), "cut").intensity, 500);
  });

  it("a sedentary routine has no days, no split and no cycling; going back to training picks 3 days", () => {
    const sedentary = withTrainingStyle(form({ cycling: true }), "sedentary");
    assert.deepEqual(sedentary.trainingDays, []);
    assert.equal(sedentary.split, null);
    assert.equal(sedentary.cycling, false);
    const cardio = withTrainingStyle(sedentary, "cardio");
    assert.deepEqual(cardio.trainingDays, [0, 2, 4]);
    assert.equal(cardio.split, null);
    assert.equal(withTrainingStyle(cardio, "strength").split, "upperLower");
  });

  it("a frequency picks a sensible spread of weekdays", () => {
    assert.deepEqual(withFrequency(form(), 2).trainingDays, [0, 3]);
    assert.deepEqual(withFrequency(form(), 6).trainingDays, [0, 1, 2, 3, 4, 5]);
  });

  it("days toggle in weekday order, at most 6", () => {
    assert.deepEqual(toggleTrainingDay(form(), 2).trainingDays, [0, 1, 2, 3, 4]);
    assert.deepEqual(toggleTrainingDay(form(), 1).trainingDays, [0, 3, 4]);
    const six = form({ trainingDays: [0, 1, 2, 3, 4, 5] });
    assert.deepEqual(toggleTrainingDay(six, 6).trainingDays, [0, 1, 2, 3, 4, 5]);
  });
});

describe("sensitive-content notice (FR-010)", () => {
  it("16:8 asks first unless already acknowledged", () => {
    assert.deepEqual(fastingNotice(form(), "if168", false), { kind: "fasting" });
    assert.equal(fastingNotice(form(), "if168", true), null);
    assert.equal(fastingNotice(form(), "classic", false), null);
    assert.equal(fastingNotice(form({ mealPattern: "if168" }), "if168", false), null);
  });

  it("a deficit of 750 kcal or more asks first; a surplus never does", () => {
    assert.deepEqual(deficitNotice(form(), 750, false), { kind: "deficit", value: 750 });
    assert.equal(deficitNotice(form(), 700, false), null);
    assert.equal(deficitNotice(form(), 800, true), null);
    assert.equal(deficitNotice(withGoal(form(), "bulk"), 800, false), null);
  });

  it("the gentler option keeps the deficit below 750 kcal", () => {
    assert.equal(gentlerIntensity(form({ intensity: 500 })), 500);
    assert.equal(gentlerIntensity(form({ intensity: 800 })), 700);
  });
});

describe("navigation and preview", () => {
  it("has four steps; jumps forward only over valid steps", () => {
    assert.equal(WIZARD_STEPS.length, 4);
    assert.equal(canGoTo(0, 3, [true, true, true, true]), true);
    assert.equal(canGoTo(0, 2, [true, false, true, true]), false);
    assert.equal(canGoTo(3, 0, [false, false, false, false]), true);
  });

  it("the live preview uses the core engine and the real daily change", () => {
    const p = wizardPreview(previous);
    assert.deepEqual(p.base, { calories: 1714, protein: 154, carbs: 86, fat: 84 });
    assert.equal(p.weeklyChange, -0.45);
    assert.equal(p.weeksToGoal, 18);
  });
});
