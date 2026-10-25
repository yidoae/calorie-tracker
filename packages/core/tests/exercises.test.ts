import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { weekFeedbackSchema, type WorkoutSession } from "../src/schemas/workout.ts";
import { EXERCISES, findExercise, MUSCLE_GROUPS } from "../src/workout/exercises.ts";
import { increment, nextTarget } from "../src/workout/plan.ts";
import { reviewWeek } from "../src/workout/review.ts";
import { normalizeTr } from "../src/search/normalize.ts";

const session = (performedOn: string, exercises: WorkoutSession["exercises"]): WorkoutSession => ({
  id: "6f1c2c47-5d7e-4c7b-9b3e-1f2a3b4c5d6e",
  performedOn,
  dayName: "A",
  exercises,
  createdAt: `${performedOn}T18:00:00Z`,
});
const sets = (kg: number, ...reps: number[]) => reps.map((r) => ({ kg, reps: r }));

// The exercise names of the ready-made splits (apps/mobile/src/hooks/workoutLogic.ts).
const TEMPLATE_NAMES = [
  "Bench press", "Incline dumbbell press", "Shoulder press", "Lateral raise", "Triceps pushdown", "Lat pulldown", "Barbell row",
  "Seated cable row", "Face pull", "Biceps curl", "Squat", "Romanian deadlift", "Leg press", "Leg curl", "Calf raise", "Deadlift",
  "Cable fly", "Hammer curl",
];

describe("exercise catalogue", () => {
  it("has 60–80 exercises, each with a known muscle group and a sane step", () => {
    assert.ok(EXERCISES.length >= 60 && EXERCISES.length <= 80, `${EXERCISES.length}`);
    for (const e of EXERCISES) {
      assert.ok((MUSCLE_GROUPS as readonly string[]).includes(e.muscle), e.name);
      assert.ok([1, 2, 2.5, 5].includes(e.stepKg), e.name);
      assert.ok(e.aliases.length > 0, e.name);
    }
  });

  it("no name or alias belongs to two exercises", () => {
    const owner = new Map<string, string>();
    for (const e of EXERCISES) {
      for (const text of [e.name, ...e.aliases]) {
        const key = normalizeTr(text);
        assert.ok(!owner.has(key) || owner.get(key) === e.name, `"${text}" in ${owner.get(key)} and ${e.name}`);
        owner.set(key, e.name);
      }
    }
  });

  it("knows every exercise of the ready-made splits", () => {
    for (const name of TEMPLATE_NAMES) assert.ok(findExercise(name), name);
  });

  it("finds by English name or Turkish alias, without case or Turkish letters", () => {
    assert.equal(findExercise("BENCH PRESS")?.name, "Bench press");
    assert.equal(findExercise("düz bench")?.name, "Bench press");
    assert.equal(findExercise("duz bench")?.name, "Bench press");
    assert.equal(findExercise("  çömelme ")?.name, "Squat");
    assert.equal(findExercise("arka kol pushdown")?.name, "Triceps pushdown");
    assert.equal(findExercise("benim hareketim"), undefined);
  });
});

describe("weight step", () => {
  it("uses the catalogue step for a known exercise", () => {
    assert.equal(increment(100, "Squat"), 5);
    assert.equal(increment(15, "Deadlift"), 5);
    assert.equal(increment(60, "Bench press"), 2.5);
    assert.equal(increment(30, "Lateral raise"), 1);
  });

  it("falls back to 1 kg under 20 kg and 2,5 kg above", () => {
    assert.equal(increment(12, "Benim hareketim"), 1);
    assert.equal(increment(40, "Benim hareketim"), 2.5);
    assert.equal(increment(40), 2.5);
  });

  it("nextTarget adds the catalogue step at the top of the range", () => {
    const t = nextTarget({ name: "leg press", sets: 3, reps: "10-12", kg: 100 }, [sets(100, 12, 12, 12)], "normal");
    assert.equal(t.kg, 105);
    assert.equal(t.change, "up_kg");
  });
});

describe("sets per muscle group", () => {
  const week = [
    session("2026-10-19", [
      { name: "Bench press", sets: sets(60, 8, 8, 8) },
      { name: "göğüs fly", sets: sets(10, 12, 12) },
      { name: "Benim hareketim", sets: sets(20, 10) },
    ]),
    session("2026-10-21", [{ name: "squat", sets: sets(80, 5, 5, 5, 5) }, { name: "Bench press", sets: sets(60, 8) }]),
  ];

  it("counts the week's sets of known exercises by muscle group, most first", () => {
    const f = reviewWeek("2026-10-19", week, null);
    assert.deepEqual(f.muscleSets, [
      { muscle: "chest", sets: 6 },
      { muscle: "quads", sets: 4 },
    ]);
    assert.ok(f.notes.includes("Bölgelere göre set: Göğüs 6, Bacak (ön) 4"));
  });

  it("stored weeks without the field still parse", () => {
    const f = reviewWeek("2026-10-19", week, null);
    const old: Record<string, unknown> = { ...f };
    delete old.muscleSets;
    assert.ok(weekFeedbackSchema.safeParse(old).success);
    assert.ok(weekFeedbackSchema.safeParse(f).success);
  });

  it("an empty week has no muscle sets and no note", () => {
    const f = reviewWeek("2026-10-26", week, null);
    assert.deepEqual(f.muscleSets, []);
    assert.ok(!f.notes.some((n) => n.startsWith("Bölgelere göre")));
  });
});
