import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { expoWeekday, reminderStep, WEEKLY_REMINDER } from "../src/hooks/notificationLogic.ts";

describe("weekly plan reminder (008, T006)", () => {
  it("is Sunday 19:00 local, in expo's numbering (1 = Sunday)", () => {
    assert.equal(expoWeekday(6), 1);
    assert.equal(expoWeekday(0), 2);
    assert.deepEqual([WEEKLY_REMINDER.weekday, WEEKLY_REMINDER.hour, WEEKLY_REMINDER.minute], [1, 19, 0]);
    assert.equal(WEEKLY_REMINDER.title, "Haftalık planın hazır");
  });

  const granted = { granted: true, canAskAgain: true, status: "granted" as const };
  const fresh = { granted: false, canAskAgain: true, status: "undetermined" as const };
  const denied = { granted: false, canAskAgain: false, status: "denied" as const };

  it("waits for the program, cancels without one", () => {
    assert.equal(reminderStep(null, granted), "wait");
    assert.equal(reminderStep(false, granted), "cancel");
    assert.equal(reminderStep(false, denied), "cancel");
  });

  it("with a program: schedules when allowed, asks once when never asked, else leaves it", () => {
    assert.equal(reminderStep(true, granted), "schedule");
    assert.equal(reminderStep(true, fresh), "ask");
    assert.equal(reminderStep(true, denied), "none");
    assert.equal(reminderStep(true, { granted: false, canAskAgain: true, status: "denied" }), "none");
  });
});
