import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { workoutProgramSchema, type WorkoutSession } from "@calorie/core/schemas/workout";
import {
  canMarkDone,
  CHANGE_LABELS,
  dayStatus,
  EMPTY_EXERCISE,
  estimatedMax,
  exerciseProgress,
  formatRest,
  programDraft,
  programFromDraft,
  REST_SECONDS,
  restLeft,
  plannedSessionDraft,
  sessionDraft,
  sessionFromDraft,
  setProgress,
  targetText,
  TEMPLATES,
  toggleWeekday,
} from "../src/hooks/workoutLogic.ts";

const session = (performedOn: string, exercises: WorkoutSession["exercises"], createdAt = `${performedOn}T10:00:00Z`): WorkoutSession => ({
  id: "6f1c2c47-5d7e-4c7b-9b3e-1f2a3b4c5d6e",
  performedOn,
  dayName: "Push",
  exercises,
  createdAt,
});

describe("templates", () => {
  it("every ready-made split is a valid program", () => {
    for (const t of TEMPLATES) assert.ok(workoutProgramSchema.safeParse(t.program).success, t.id);
  });
});

describe("program editor", () => {
  it("a program survives the round trip through the text fields, with decimal commas", () => {
    const program = { name: "PPL", split: "Push / Pull / Legs", weekdays: [0, 2, 4], days: [{ name: "Push", exercises: [{ name: "Bench press", sets: 4, reps: "6-8", kg: 62.5 }] }] };
    const draft = programDraft(program);
    assert.equal(draft.days[0].exercises[0].kg, "62,5");
    assert.deepEqual(programFromDraft(draft), { ok: true, value: program });
  });

  it("an empty kg is no target", () => {
    const draft = { name: "P", split: "Özel", weekdays: [], days: [{ name: "Gün 1", exercises: [{ ...EMPTY_EXERCISE, name: "Squat" }] }] };
    const result = programFromDraft(draft);
    assert.ok(result.ok && result.value.days[0].exercises[0].kg === null);
  });

  it("a kg that is not a number is a problem, not a missing target", () => {
    const draft = { name: "P", split: "Özel", weekdays: [], days: [{ name: "Gün 1", exercises: [{ ...EMPTY_EXERCISE, name: "Squat", kg: "60kg" }] }] };
    const result = programFromDraft(draft);
    assert.deepEqual(result, { ok: false, error: "1. gün, 1. hareket · kg: Bir sayı yaz" });
    const sets = programFromDraft({ ...draft, days: [{ name: "Gün 1", exercises: [{ ...EMPTY_EXERCISE, name: "Squat", sets: "x" }] }] });
    assert.deepEqual(sets, { ok: false, error: "1. gün, 1. hareket · set: Bir sayı yaz" });
  });

  it("names where the first problem is", () => {
    const draft = { name: "P", split: "Özel", weekdays: [], days: [{ name: "A", exercises: [] }, { name: "B", exercises: [{ ...EMPTY_EXERCISE }, { ...EMPTY_EXERCISE, name: "Row", sets: "x" }] }] };
    const result = programFromDraft(draft);
    assert.ok(!result.ok && result.error.startsWith("2. gün, 1. hareket · ad"), JSON.stringify(result));
  });
});

describe("workout logger", () => {
  const day = { name: "Push", exercises: [{ name: "Bench press", sets: 3, reps: "6-8", kg: 60 }, { name: "Dips", sets: 2, reps: "AMRAP", kg: null }] };
  const set = (kg: string, reps: string, done = true) => ({ kg, reps, done });
  const one = (name: string, sets: ReturnType<typeof set>[]) => ({ dayName: "Push", exercises: [{ name, target: "", sets }] });

  it("a never-logged exercise starts from the targets, no set done yet", () => {
    const draft = sessionDraft(day, []);
    assert.deepEqual(draft.exercises[0].sets, [set("60", "6", false), set("60", "6", false), set("60", "6", false)]);
    assert.deepEqual(draft.exercises[1].sets, [set("", "", false), set("", "", false)]);
    assert.equal(draft.exercises[0].target, "3 × 6-8 · 60 kg");
  });

  it("a logged exercise starts from its latest sets, matched without case or Turkish letters", () => {
    const history = [
      session("2026-10-20", [{ name: "bench press", sets: [{ kg: 60, reps: 8 }] }]),
      session("2026-10-23", [{ name: "BENCH PRESS", sets: [{ kg: 62.5, reps: 6 }, { kg: 62.5, reps: 5 }] }]),
    ];
    assert.deepEqual(sessionDraft(day, history).exercises[0].sets, [set("62,5", "6", false), set("62,5", "5", false)]);
  });

  it("saves only the sets marked done; untouched exercises are left out", () => {
    const draft = {
      dayName: "Push",
      exercises: [
        { name: "Bench press", target: "", sets: [set("60", "8"), set("60", "8", false), set("", "", false)] },
        { name: "Dips", target: "", sets: [set("", "", false)] },
      ],
    };
    assert.deepEqual(sessionFromDraft(draft, "2026-10-25"), {
      ok: true,
      value: { performedOn: "2026-10-25", dayName: "Push", exercises: [{ name: "Bench press", sets: [{ kg: 60, reps: 8 }] }] },
    });
  });

  it("refuses a workout with no set done and impossible numbers", () => {
    assert.deepEqual(sessionFromDraft(one("Squat", [set("100", "5", false)]), "2026-10-25"), { ok: false, error: "Kaydetmek için en az bir seti ✓ ile işaretle." });
    const bad = sessionFromDraft(one("Squat", [set("100", "0")]), "2026-10-25");
    assert.ok(!bad.ok && bad.error.startsWith("Squat · tekrar"), JSON.stringify(bad));
    assert.deepEqual(sessionFromDraft(one("Squat", [set("abc", "5")]), "2026-10-25"), { ok: false, error: "Squat · kg: Bir sayı yaz" });
  });

  it("a done set emptied afterwards is a problem, not a skipped set", () => {
    assert.deepEqual(sessionFromDraft(one("Squat", [set("100", "5"), set("100", "")]), "2026-10-25"), { ok: false, error: "Squat · 2. sette kilo ve tekrar ikisi de dolu olmalı" });
    assert.deepEqual(sessionFromDraft(one("Squat", [set(" ", "5")]), "2026-10-25"), { ok: false, error: "Squat · 1. sette kilo ve tekrar ikisi de dolu olmalı" });
  });

  it("a set can be marked done once both fields are filled", () => {
    assert.equal(canMarkDone(set("60", "8", false)), true);
    assert.equal(canMarkDone(set("60", " ", false)), false);
    assert.equal(canMarkDone(set("", "8", false)), false);
  });

  it("counts the done sets of the whole workout", () => {
    const draft = { dayName: "Push", exercises: [{ name: "A", target: "", sets: [set("1", "1"), set("1", "1", false)] }, { name: "B", target: "", sets: [set("1", "1")] }] };
    assert.deepEqual(setProgress(draft), { done: 2, total: 3 });
  });

  it("counts the rest down in whole seconds and shows it as m:ss", () => {
    assert.equal(REST_SECONDS, 90);
    assert.equal(restLeft(100_000, 10_000), 90);
    assert.equal(restLeft(100_000, 99_001), 1);
    assert.equal(restLeft(100_000, 120_000), 0);
    assert.equal(formatRest(90), "1:30");
    assert.equal(formatRest(5), "0:05");
  });
});

describe("weight progress", () => {
  it("Epley estimate, a single is the lift itself", () => {
    assert.equal(estimatedMax(100, 1), 100);
    assert.equal(estimatedMax(100, 5), 116.5);
  });

  it("per exercise, oldest entry first, the most recently done exercise first", () => {
    const progress = exerciseProgress([
      session("2026-10-23", [{ name: "Squat", sets: [{ kg: 100, reps: 5 }, { kg: 105, reps: 3 }, { kg: 105, reps: 4 }] }]),
      session("2026-10-20", [{ name: "Squat", sets: [{ kg: 100, reps: 5 }] }, { name: "Bench press", sets: [{ kg: 60, reps: 8 }] }]),
      session("2026-10-21", [{ name: "Bench press", sets: [{ kg: 62.5, reps: 6 }] }]),
    ]);
    assert.deepEqual(progress.map((p) => p.name), ["Squat", "Bench press"]);
    const squat = progress[0];
    assert.deepEqual(squat.entries.map((e) => e.date), ["2026-10-20", "2026-10-23"]);
    assert.deepEqual([squat.entries[1].topKg, squat.entries[1].topReps], [105, 4], "heaviest set, more reps wins the tie");
    assert.equal(squat.entries[1].volume, 500 + 315 + 420);
    assert.equal(squat.bestKg, 105);
    assert.equal(squat.bestE1rm, 119);
  });
});

describe("weekly plan day (008)", () => {
  it("every set starts at the planned weight and reps, and the target says why", () => {
    const draft = plannedSessionDraft({
      date: "2026-10-26",
      name: "Push",
      exercises: [
        { name: "Bench press", sets: 2, reps: "6", kg: 62.5, change: "up_kg" },
        { name: "Dips", sets: 1, reps: "AMRAP", kg: null, change: "new" },
      ],
    });
    assert.deepEqual(draft.exercises[0], {
      name: "Bench press",
      target: "2 × 6 · 62,5 kg · kilo arttı",
      sets: [{ kg: "62,5", reps: "6", done: false }, { kg: "62,5", reps: "6", done: false }],
    });
    assert.deepEqual(draft.exercises[1].sets, [{ kg: "", reps: "", done: false }]);
  });
});

describe("weekly plan card (008, T005)", () => {
  it("writes a target as sets × reps · kg, without kg for bodyweight", () => {
    assert.equal(targetText({ sets: 3, reps: "6-8", kg: 62.5 }), "3 × 6-8 · 62,5 kg");
    assert.equal(targetText({ sets: 2, reps: "AMRAP", kg: null }), "2 × AMRAP");
  });

  it("names why a target moved; a first target has no chip", () => {
    assert.deepEqual(CHANGE_LABELS, { new: null, up_kg: "kilo arttı", up_reps: "+1 tekrar", hold: "aynı", deload: "hafif hafta" });
  });

  it("toggles a training weekday, keeping Monday-first order", () => {
    assert.deepEqual(toggleWeekday([0, 3], 2), [0, 2, 3]);
    assert.deepEqual(toggleWeekday([0, 2], 0), [2]);
  });

  it("tells a planned day's state: done, today, missed or still to come", () => {
    const done = new Set(["2026-10-20"]);
    assert.equal(dayStatus("2026-10-20", "2026-10-22", done), "done");
    assert.equal(dayStatus("2026-10-22", "2026-10-22", done), "today");
    assert.equal(dayStatus("2026-10-21", "2026-10-22", done), "missed");
    assert.equal(dayStatus("2026-10-24", "2026-10-22", done), "upcoming");
  });
});

describe("names from the exercise catalogue (007 progress, like 008)", () => {
  const session = (performedOn: string, name: string, kg: number) => ({ id: "6f1c2c47-5d7e-4c7b-9b3e-1f2a3b4c5d6e", performedOn, dayName: "Push", exercises: [{ name, sets: [{ kg, reps: 8 }] }], createdAt: `${performedOn}T10:00:00Z` });

  it("an alias and the catalogue name are one exercise in the progress list", () => {
    const progress = exerciseProgress([session("2026-10-20", "düz bench", 60), session("2026-10-23", "Bench press", 62.5)]);
    assert.equal(progress.length, 1);
    assert.deepEqual(progress[0].entries.map((e) => e.topKg), [60, 62.5]);
  });

  it("a program exercise starts from the last time it was logged under an alias", () => {
    const day = { name: "Push", exercises: [{ name: "Bench press", sets: 1, reps: "6-8", kg: null }] };
    assert.deepEqual(sessionDraft(day, [session("2026-10-20", "düz bench", 60)]).exercises[0].sets, [{ kg: "60", reps: "8", done: false }]);
  });
});
