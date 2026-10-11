import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Profile } from "@calorie/core/schemas/rows";
import {
  ageFromBirthYear,
  answersFromProfile,
  firstUnansweredStep,
  formatNumber,
  isSetupStep,
  numberFieldError,
  parseNumber,
  SETUP_STEPS,
  stepAfter,
  stepBefore,
} from "../src/hooks/setupSteps.ts";

const YEAR = 2026;

const fresh: Profile = {
  id: "00000000-0000-4000-8000-000000000001",
  sex: null,
  birthYear: null,
  heightCm: null,
  weightKg: null,
  goalWeightKg: null,
  activityLevel: null,
  dietStyle: null,
  fatPerKg: 1.2,
  timeZone: null,
  onboardingCompleted: false,
  sensitiveWarningAck: false,
};

const answered: Profile = {
  ...fresh,
  sex: "female",
  birthYear: 1996,
  heightCm: 165,
  weightKg: 70,
  goalWeightKg: 62,
  activityLevel: "moderate",
  dietStyle: "highProtein",
};

describe("setup steps", () => {
  it("follow contracts/screens.md and end with the summary", () => {
    assert.deepEqual(SETUP_STEPS, ["basics", "body", "goal", "activity", "diet", "summary"]);
    assert.equal(stepAfter("basics"), "body");
    assert.equal(stepAfter("summary"), null);
    assert.equal(stepBefore("basics"), null);
    assert.equal(stepBefore("summary"), "diet");
  });

  it("recognise only their own names in the route", () => {
    assert.ok(isSetupStep("goal"));
    for (const bad of ["Goal", "", undefined, ["goal"], "index"]) assert.equal(isSetupStep(bad), false, String(bad));
  });

  it("resume at the first unanswered step (FR-006)", () => {
    assert.equal(firstUnansweredStep(fresh, YEAR), "basics");
    assert.equal(firstUnansweredStep({ ...fresh, sex: "male" }, YEAR), "basics", "age is still missing");
    assert.equal(firstUnansweredStep({ ...fresh, sex: "male", birthYear: 1990 }, YEAR), "body");
    assert.equal(firstUnansweredStep({ ...answered, heightCm: null }, YEAR), "body");
    assert.equal(firstUnansweredStep({ ...answered, goalWeightKg: null }, YEAR), "goal");
    assert.equal(firstUnansweredStep({ ...answered, activityLevel: null }, YEAR), "activity");
    assert.equal(firstUnansweredStep({ ...answered, dietStyle: null }, YEAR), "diet");
    assert.equal(firstUnansweredStep(answered, YEAR), "summary");
  });

  it("treat a stored value that is out of range today as unanswered", () => {
    assert.equal(firstUnansweredStep({ ...answered, birthYear: YEAR - 10 }, YEAR), "basics");
    assert.equal(firstUnansweredStep({ ...answered, weightKg: 400 }, YEAR), "body");
  });

  it("compute the age from the birth year as complete_onboarding stores it", () => {
    assert.equal(ageFromBirthYear(1996, YEAR), 30);
    assert.equal(ageFromBirthYear(null, YEAR), null);
  });

  it("build the setup answers only once every step is answered", () => {
    assert.equal(answersFromProfile({ ...answered, dietStyle: null }, YEAR, "Europe/Istanbul"), null);
    assert.deepEqual(answersFromProfile(answered, YEAR, "Europe/Istanbul"), {
      sex: "female",
      age: 30,
      heightCm: 165,
      weightKg: 70,
      targetWeightKg: 62,
      activity: "moderate",
      dietStyle: "highProtein",
      fatPerKg: 1.2,
      timeZone: "Europe/Istanbul",
    });
  });
});

describe("number fields", () => {
  it("read Turkish and English decimals", () => {
    assert.equal(parseNumber("72,5"), 72.5);
    assert.equal(parseNumber(" 72.5 "), 72.5);
    assert.equal(parseNumber("180"), 180);
    for (const bad of ["", "  ", "abc", "1,2,3", "-5", "72,", ",5"]) assert.equal(parseNumber(bad), null, bad);
  });

  it("show stored numbers with a decimal comma", () => {
    assert.equal(formatNumber(72.5), "72,5");
    assert.equal(formatNumber(180), "180");
    assert.equal(formatNumber(null), "");
  });

  it("explain in Turkish what is missing or out of range (US2 scenario 3)", () => {
    assert.equal(numberFieldError("heightCm", "300"), "Boy 100–250 cm arasında olmalı.");
    assert.equal(numberFieldError("heightCm", ""), "Boyunu yaz.");
    assert.equal(numberFieldError("weightKg", "29,9"), "Kilo 30–300 kg arasında olmalı.");
    assert.equal(numberFieldError("targetWeightKg", "abc"), "Hedef kilo 30–300 kg arasında olmalı.");
    assert.equal(numberFieldError("age", "30,5"), "Yaş 15–100 arasında bir tam sayı olmalı.");
    assert.equal(numberFieldError("age", "14"), "Yaş 15–100 arasında bir tam sayı olmalı.");
  });

  it("accept the limits themselves", () => {
    for (const [field, text] of [["heightCm", "100"], ["heightCm", "250"], ["weightKg", "30"], ["weightKg", "300"], ["age", "15"], ["age", "100"]] as const) {
      assert.equal(numberFieldError(field, text), null, `${field} ${text}`);
    }
  });
});
