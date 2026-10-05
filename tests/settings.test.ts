import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EMPTY_SETTINGS, parseSettings } from "@/types/settings";

describe("parseSettings: fasting", () => {
  it("keeps a valid fasting window", () => {
    const fasting = { enabled: true, preset: "16:8", eatStart: 720, eatEnd: 1200 };
    assert.deepEqual(parseSettings({ fasting }).fasting, fasting);
  });

  it("drops a broken one without touching the rest", () => {
    const s = parseSettings({ fasting: { enabled: true, preset: "16:8", eatStart: 720, eatEnd: 720 }, waterGoalMl: 2000 });
    assert.equal(s.fasting, null);
    assert.equal(s.waterGoalMl, 2000);
  });

  it("falls back to the defaults for empty or bad input", () => {
    assert.deepEqual(parseSettings({}), EMPTY_SETTINGS);
    assert.deepEqual(parseSettings("nope"), EMPTY_SETTINGS);
  });
});
