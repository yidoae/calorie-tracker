import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fastingState, formatCountdown, formatMinuteOfDay, parseMinuteOfDay, presetWindow } from "@/lib/nutrition/fasting";

const at = (h: number, m = 0) => new Date(2026, 9, 6, h, m);
const noonToEight = { eatStart: 12 * 60, eatEnd: 20 * 60 };

describe("fastingState", () => {
  it("is eating inside the window and counts down to its end", () => {
    const s = fastingState(at(15), noonToEight);
    assert.equal(s.phase, "eating");
    assert.equal(s.remainingMs, 5 * 3_600_000);
    assert.equal(s.eatingMinutes, 480);
    assert.equal(s.fastingMinutes, 960);
  });

  it("fasts after the window until tomorrow's start", () => {
    const s = fastingState(at(21, 30), noonToEight);
    assert.equal(s.phase, "fasting");
    assert.equal(s.phaseEnd.getTime(), new Date(2026, 9, 7, 12).getTime());
    assert.ok(s.progress > 0 && s.progress < 0.2);
  });

  it("fasts before the window (the fast started last night)", () => {
    const s = fastingState(at(8), noonToEight);
    assert.equal(s.phase, "fasting");
    assert.equal(s.phaseStart.getTime(), new Date(2026, 9, 5, 20).getTime());
  });

  it("handles windows across midnight", () => {
    const lateNight = { eatStart: 22 * 60, eatEnd: 2 * 60 };
    assert.equal(fastingState(at(1), lateNight).phase, "eating");
    assert.equal(fastingState(at(23), lateNight).phase, "eating");
    assert.equal(fastingState(at(3), lateNight).phase, "fasting");
  });

  it("switches exactly at the boundaries", () => {
    assert.equal(fastingState(at(12), noonToEight).phase, "eating");
    assert.equal(fastingState(at(20), noonToEight).phase, "fasting");
  });
});

describe("fasting helpers", () => {
  it("presets keep the start and set the length", () => {
    assert.deepEqual(presetWindow("18:6", 600, 0), { eatStart: 600, eatEnd: 960 });
    assert.deepEqual(presetWindow("16:8", 20 * 60, 0), { eatStart: 1200, eatEnd: 240 });
    assert.deepEqual(presetWindow("custom", 100, 200), { eatStart: 100, eatEnd: 200 });
  });

  it("parses and formats clock times", () => {
    assert.equal(parseMinuteOfDay("12:30"), 750);
    assert.equal(parseMinuteOfDay("24:00"), null);
    assert.equal(parseMinuteOfDay("abc"), null);
    assert.equal(formatMinuteOfDay(750), "12:30");
    assert.equal(formatCountdown(3_723_000), "01:02:03");
  });
});
