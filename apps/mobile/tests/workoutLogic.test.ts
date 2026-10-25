import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { workoutProgramSchema, type WorkoutSession } from "@calorie/core/schemas/workout";
import {
  EMPTY_EXERCISE,
  estimatedMax,
  exerciseProgress,
  programDraft,
  programFromDraft,
  sessionDraft,
  sessionFromDraft,
  TEMPLATES,
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
    const program = { name: "PPL", split: "Push / Pull / Legs", days: [{ name: "Push", exercises: [{ name: "Bench press", sets: 4, reps: "6-8", kg: 62.5 }] }] };
    const draft = programDraft(program);
    assert.equal(draft.days[0].exercises[0].kg, "62,5");
    assert.deepEqual(programFromDraft(draft), { ok: true, value: program });
  });

  it("an empty kg is no target", () => {
    const draft = { name: "P", split: "Özel", days: [{ name: "Gün 1", exercises: [{ ...EMPTY_EXERCISE, name: "Squat" }] }] };
    const result = programFromDraft(draft);
    assert.ok(result.ok && result.value.days[0].exercises[0].kg === null);
  });

  it("a kg that is not a number is a problem, not a missing target", () => {
    const draft = { name: "P", split: "Özel", days: [{ name: "Gün 1", exercises: [{ ...EMPTY_EXERCISE, name: "Squat", kg: "60kg" }] }] };
    const result = programFromDraft(draft);
    assert.ok(!result.ok && result.error.startsWith("1. gün, 1. hareket · kg"), JSON.stringify(result));
  });

  it("names where the first problem is", () => {
    const draft = { name: "P", split: "Özel", days: [{ name: "A", exercises: [] }, { name: "B", exercises: [{ ...EMPTY_EXERCISE }, { ...EMPTY_EXERCISE, name: "Row", sets: "x" }] }] };
    const result = programFromDraft(draft);
    assert.ok(!result.ok && result.error.startsWith("2. gün, 1. hareket · ad"), JSON.stringify(result));
  });
});

describe("workout logger", () => {
  const day = { name: "Push", exercises: [{ name: "Bench press", sets: 3, reps: "6-8", kg: 60 }, { name: "Dips", sets: 2, reps: "AMRAP", kg: null }] };

  it("a never-logged exercise starts from the targets", () => {
    const draft = sessionDraft(day, []);
    assert.deepEqual(draft.exercises[0].sets, [{ kg: "60", reps: "6" }, { kg: "60", reps: "6" }, { kg: "60", reps: "6" }]);
    assert.deepEqual(draft.exercises[1].sets, [{ kg: "", reps: "" }, { kg: "", reps: "" }]);
    assert.equal(draft.exercises[0].target, "3 × 6-8 · 60 kg");
  });

  it("a logged exercise starts from its latest sets, matched without case or Turkish letters", () => {
    const history = [
      session("2026-10-20", [{ name: "bench press", sets: [{ kg: 60, reps: 8 }] }]),
      session("2026-10-23", [{ name: "BENCH PRESS", sets: [{ kg: 62.5, reps: 6 }, { kg: 62.5, reps: 5 }] }]),
    ];
    assert.deepEqual(sessionDraft(day, history).exercises[0].sets, [{ kg: "62,5", reps: "6" }, { kg: "62,5", reps: "5" }]);
  });

  it("saves filled sets and skips empty ones and untouched exercises", () => {
    const draft = { dayName: "Push", exercises: [{ name: "Bench press", target: "", sets: [{ kg: "60", reps: "8" }, { kg: "", reps: "" }] }, { name: "Dips", target: "", sets: [{ kg: "", reps: "" }] }] };
    assert.deepEqual(sessionFromDraft(draft, "2026-10-25"), {
      ok: true,
      value: { performedOn: "2026-10-25", dayName: "Push", exercises: [{ name: "Bench press", sets: [{ kg: 60, reps: 8 }] }] },
    });
  });

  it("refuses an empty workout and impossible numbers", () => {
    assert.deepEqual(sessionFromDraft({ dayName: "Push", exercises: [{ name: "Dips", target: "", sets: [{ kg: "", reps: "" }] }] }, "2026-10-25"), {
      ok: false,
      error: "En az bir sete kilo ve tekrar yaz.",
    });
    const bad = sessionFromDraft({ dayName: "Push", exercises: [{ name: "Squat", target: "", sets: [{ kg: "100", reps: "0" }] }] }, "2026-10-25");
    assert.ok(!bad.ok && bad.error.startsWith("Squat · tekrar"), JSON.stringify(bad));
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
