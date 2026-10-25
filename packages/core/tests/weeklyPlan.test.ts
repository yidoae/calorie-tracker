import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { weekPlanSchema, type WeekPlan, type WorkoutProgram, type WorkoutSession } from "../src/schemas/workout.ts";
import { nextTarget, planWeek, repRange, trainingWeekdays, weekIntensity, weeksDue } from "../src/workout/plan.ts";
import { estimatedMax, isStalled, mondayOf, reviewWeek } from "../src/workout/review.ts";

const ID = "6f1c2c47-5d7e-4c7b-9b3e-1f2a3b4c5d6e";
const session = (performedOn: string, dayName: string, exercises: WorkoutSession["exercises"]): WorkoutSession => ({
  id: ID,
  performedOn,
  dayName,
  exercises,
  createdAt: `${performedOn}T18:00:00Z`,
});
const sets = (kg: number, ...reps: number[]) => reps.map((r) => ({ kg, reps: r }));
const bench = { name: "Bench press", sets: 3, reps: "6-8", kg: 60 };
const PPL: WorkoutProgram = {
  name: "PPL",
  split: "Push / Pull / Legs",
  weekdays: [],
  days: [
    { name: "Push", exercises: [bench] },
    { name: "Pull", exercises: [{ name: "Barbell row", sets: 3, reps: "8-10", kg: 50 }] },
    { name: "Legs", exercises: [{ name: "Squat", sets: 3, reps: "5", kg: 80 }] },
  ],
};

describe("calendar", () => {
  it("Monday of any day, across months and years", () => {
    assert.equal(mondayOf("2026-10-25"), "2026-10-19"); // Sunday
    assert.equal(mondayOf("2026-10-19"), "2026-10-19");
    assert.equal(mondayOf("2027-01-02"), "2026-12-28");
  });

  it("from Sunday 18:00 the next week is due as well", () => {
    assert.deepEqual(weeksDue("2026-10-25", 17), ["2026-10-19"]);
    assert.deepEqual(weeksDue("2026-10-25", 18), ["2026-10-19", "2026-10-26"]);
    assert.deepEqual(weeksDue("2026-10-21", 23), ["2026-10-19"]);
  });

  it("chosen weekdays win; otherwise the days spread with rest between", () => {
    assert.deepEqual(trainingWeekdays(PPL), [0, 2, 4]);
    assert.deepEqual(trainingWeekdays({ ...PPL, weekdays: [5, 0, 2] }), [0, 2, 5]);
  });
});

describe("targets (double progression)", () => {
  it("reads rep ranges", () => {
    assert.deepEqual(repRange("8-12"), [8, 12]);
    assert.deepEqual(repRange(" 5 "), [5, 5]);
    assert.deepEqual(repRange("12-8"), [8, 12]);
    assert.equal(repRange("AMRAP"), null);
  });

  it("never logged: the program's target", () => {
    assert.deepEqual(nextTarget(bench, [], "normal"), { ...bench, change: "new" });
  });

  it("every set at the top of the range: more weight, back to the bottom", () => {
    assert.deepEqual(nextTarget(bench, [sets(60, 8, 8, 8)], "normal"), { ...bench, kg: 62.5, reps: "6", change: "up_kg" });
    assert.equal(nextTarget({ ...bench, kg: 12 }, [sets(12, 8, 8, 8)], "normal").kg, 13, "1 kg steps under 20 kg");
  });

  it("inside the range: one more rep at the same weight", () => {
    assert.deepEqual(nextTarget(bench, [sets(60, 8, 7, 6)], "normal"), { ...bench, kg: 60, reps: "7", change: "up_reps" });
  });

  it("below the range: hold; a light week holds too", () => {
    assert.deepEqual(nextTarget(bench, [sets(60, 6, 5, 4)], "normal"), { ...bench, kg: 60, reps: "6", change: "hold" });
    assert.equal(nextTarget(bench, [sets(60, 8, 8, 8)], "light").change, "hold");
  });

  it("the working weight is the heaviest set; fewer sets than planned do not add weight", () => {
    assert.equal(nextTarget(bench, [[{ kg: 40, reps: 10 }, ...sets(60, 8, 8)]], "normal").change, "hold");
  });

  it("deload: about 10 % lighter and one set fewer", () => {
    assert.deepEqual(nextTarget(bench, [sets(60, 8, 8, 8)], "deload"), { ...bench, sets: 2, kg: 54, reps: "6", change: "deload" });
  });

  it("bodyweight (0 kg) only adds reps", () => {
    const dips = { name: "Dips", sets: 3, reps: "8-12", kg: null };
    assert.equal(nextTarget(dips, [sets(0, 12, 12, 12)], "normal").change, "hold");
    assert.equal(nextTarget(dips, [sets(0, 10, 10, 10)], "normal").reps, "11");
  });
});

describe("week intensity", () => {
  const normal = { intensity: "normal" } as const;
  it("a deload after five weeks without one, never two in a row", () => {
    assert.equal(weekIntensity(Array(5).fill(normal), 1, 0), "deload");
    assert.equal(weekIntensity(Array(4).fill(normal), 1, 0), "normal");
    assert.equal(weekIntensity([{ intensity: "deload" }, ...Array(6).fill(normal)], 1, 0.9), "normal");
  });

  it("many stalls bring the deload forward; a missed week holds the weights", () => {
    assert.equal(weekIntensity([normal], 1, 0.5), "deload");
    assert.equal(weekIntensity([normal], 0.33, 0), "light");
  });
});

describe("weekly feedback", () => {
  const history = [
    session("2026-10-05", "Push", [{ name: "Bench press", sets: sets(57.5, 8, 8, 8) }]),
    session("2026-10-12", "Push", [{ name: "Bench press", sets: sets(60, 8, 8, 8) }]),
    session("2026-10-19", "Push", [{ name: "bench PRESS", sets: sets(62.5, 7, 6, 6) }]),
    session("2026-10-21", "Legs", [{ name: "Squat", sets: sets(80, 5, 5, 5) }]),
  ];

  it("counts against the plan, compares volume and finds records", () => {
    const plan = { weekStart: "2026-10-19", intensity: "normal", days: [{}, {}, {}], feedback: null } as unknown as WeekPlan;
    const f = reviewWeek("2026-10-19", history, plan);
    assert.equal(f.headline, "Planlanan 3 antrenmandan 2 tanesi yapıldı.");
    assert.equal(f.volume, 62.5 * 19 + 80 * 15);
    assert.equal(f.volumeChangePct, Math.round(((62.5 * 19 + 1200) / 1440 - 1) * 100));
    assert.deepEqual(f.records, [{ name: "bench PRESS", kg: 62.5, reps: 7 }]);
    assert.ok(f.notes[0].startsWith("Yeni rekor: bench PRESS 62,5 kg × 7"));
  });

  it("an empty week says so", () => {
    assert.equal(reviewWeek("2026-10-26", history, null).headline, "Bu hafta antrenman kaydı yok.");
  });

  it("stalls are three workouts without a better estimated max", () => {
    assert.ok(isStalled([sets(60, 6), sets(60, 7), sets(60, 7)]));
    assert.ok(!isStalled([sets(60, 8), sets(60, 7), sets(60, 7)]));
    assert.ok(!isStalled([sets(60, 6), sets(60, 6)]));
    assert.equal(estimatedMax(100, 5), 116.5);
  });
});

describe("planning a week", () => {
  const history = [
    session("2026-10-19", "Push", [{ name: "Bench press", sets: sets(60, 8, 8, 8) }]),
    session("2026-10-21", "Pull", [{ name: "Barbell row", sets: sets(50, 9, 8, 8) }]),
  ];

  it("dates the days, continues the rotation and moves each target", () => {
    const plan = planWeek({ weekStart: "2026-10-26", program: PPL, sessions: history, pastWeeks: [] });
    assert.ok(weekPlanSchema.safeParse(plan).success);
    assert.equal(plan.intensity, "normal");
    assert.deepEqual(plan.days.map((d) => [d.date, d.name]), [["2026-10-26", "Legs"], ["2026-10-28", "Push"], ["2026-10-30", "Pull"]]);
    assert.deepEqual(plan.days[0].exercises[0], { name: "Squat", sets: 3, reps: "5", kg: 80, change: "new" });
    assert.equal(plan.days[1].exercises[0].kg, 62.5);
    assert.equal(plan.days[2].exercises[0].reps, "9");
    assert.equal(plan.feedback?.headline, "2 antrenman yapıldı.");
  });

  it("only sessions before the week count, so planning again gives the same plan", () => {
    const later = [...history, session("2026-10-26", "Legs", [{ name: "Squat", sets: sets(80, 5, 5, 5) }])];
    assert.deepEqual(planWeek({ weekStart: "2026-10-26", program: PPL, sessions: later, pastWeeks: [] }), planWeek({ weekStart: "2026-10-26", program: PPL, sessions: history, pastWeeks: [] }));
  });

  it("a first week has no feedback and starts at day one", () => {
    const plan = planWeek({ weekStart: "2026-10-26", program: PPL, sessions: [], pastWeeks: [] });
    assert.equal(plan.feedback, null);
    assert.equal(plan.days[0].name, "Push");
  });
});
