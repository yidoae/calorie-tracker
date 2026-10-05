import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { presetWindow } from "@/lib/nutrition/fasting";
import { fastingSettingsSchema } from "@/types/fasting";
import { createMealSchema, createSavedMealSchema, updateMealSchema } from "@/types/meal";

const meal = {
  name: "Kahvaltı",
  slot: "breakfast" as const,
  items: [{ name: "Yumurta", category: "protein" as const, grams: 100, per100g: { calories: 155, protein: 13, carbs: 1.1, fat: 11 } }],
};

describe("fasting window from a 16:8 plan starting at 16:00", () => {
  it("wraps past midnight and stays saveable", () => {
    const window = presetWindow("16:8", 16 * 60, 0);
    assert.deepEqual(window, { eatStart: 960, eatEnd: 0 });
    assert.ok(fastingSettingsSchema.safeParse({ enabled: true, preset: "16:8", ...window }).success);
  });
});

describe("restoring a meal at its original time", () => {
  it("accepts a past log time", () => {
    const loggedAt = new Date(Date.now() - 6 * 3_600_000).toISOString();
    assert.equal(createMealSchema.parse({ ...meal, loggedAt }).loggedAt, loggedAt);
  });

  it("rejects times far in the future or the distant past", () => {
    assert.equal(createMealSchema.safeParse({ ...meal, loggedAt: new Date(Date.now() + 3_600_000).toISOString() }).success, false);
    assert.equal(createMealSchema.safeParse({ ...meal, loggedAt: "2020-01-01T00:00:00Z" }).success, false);
  });

  it("is only for logging: updates and saved meals ignore it", () => {
    const loggedAt = new Date().toISOString();
    assert.equal("loggedAt" in updateMealSchema.parse({ ...meal, loggedAt }), false);
    assert.equal("loggedAt" in createSavedMealSchema.parse({ ...meal, loggedAt }), false);
  });
});
