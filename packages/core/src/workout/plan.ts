import type { PlannedDay, PlannedExercise, ProgramExercise, WeekIntensity, WeekPlan, WorkoutProgram, WorkoutSession, WorkoutSet } from "../schemas/workout.ts";
import { normalizeTr } from "../search/normalize.ts";
import { addDays, exerciseHistory, isStalled, mondayOf, newestFirst, reviewWeek, weekdayOf } from "./review.ts";

/*
 * 008: the next training week, built from the program and the logged weights (specs/008-weekly-plan).
 * From Sunday 18:00 the app plans the week ahead; a week that has no plan yet gets one on open.
 * Targets follow double progression: within the rep range add a rep, at the top of the range add
 * weight and start again at the bottom. Every sixth week, or when many exercises stall, is a deload;
 * after a week with less than half the plan done, weights hold.
 */

/** From this local hour on Sunday the next week is planned. */
export const PLAN_HOUR = 18;
const DELOAD_EVERY = 6;
const STALL_SHARE = 0.4;
const DELOAD_FACTOR = 0.9;

/** The weeks (their Mondays) that need a plan at this local date and hour. */
export function weeksDue(today: string, hour: number): string[] {
  const monday = mondayOf(today);
  return weekdayOf(today) === 6 && hour >= PLAN_HOUR ? [monday, addDays(monday, 7)] : [monday];
}

/** Weekdays when none are chosen: the program's days spread over the week with rest between. */
const SPREAD: Record<number, number[]> = { 1: [0], 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5], 7: [0, 1, 2, 3, 4, 5, 6] };

export function trainingWeekdays(program: WorkoutProgram): number[] {
  return program.weekdays.length > 0 ? [...program.weekdays].sort((a, b) => a - b) : SPREAD[program.days.length];
}

/** "8-12" → [8, 12], "5" → [5, 5]; null for text like "AMRAP". */
export function repRange(reps: string): [number, number] | null {
  const m = /^(\d+)\s*(?:-\s*(\d+))?$/.exec(reps.trim());
  if (!m) return null;
  const a = Number(m[1]);
  const b = m[2] === undefined ? a : Number(m[2]);
  return a <= b ? [a, b] : [b, a];
}

/** The usual plate step: 1 kg under 20 kg (dumbbells, isolation), 2.5 kg above. */
export const increment = (kg: number) => (kg < 20 ? 1 : 2.5);
const roundKg = (kg: number) => Math.round(kg * 2) / 2;

/** One exercise's target for the week from its latest logged sets. */
export function nextTarget(exercise: ProgramExercise, history: readonly WorkoutSet[][], intensity: WeekIntensity): PlannedExercise {
  const last = history[0];
  if (!last) return { ...exercise, change: "new" };
  const top = Math.max(...last.map((s) => s.kg));
  const range = repRange(exercise.reps);
  if (intensity === "deload") {
    return { ...exercise, sets: Math.max(1, exercise.sets - 1), kg: roundKg(top * DELOAD_FACTOR), reps: range ? String(range[0]) : exercise.reps, change: "deload" };
  }
  if (!range) return { ...exercise, kg: top, change: "hold" };
  const [lo, hi] = range;
  const minReps = Math.min(...last.filter((s) => s.kg === top).map((s) => s.reps));
  const allSets = last.filter((s) => s.kg === top).length >= exercise.sets;
  if (intensity === "normal" && top > 0 && allSets && minReps >= hi) return { ...exercise, kg: roundKg(top + increment(top)), reps: String(lo), change: "up_kg" };
  if (intensity === "normal" && minReps >= lo && minReps < hi) return { ...exercise, kg: top, reps: String(minReps + 1), change: "up_reps" };
  return { ...exercise, kg: top, reps: String(Math.min(hi, Math.max(lo, minReps))), change: "hold" };
}

/** The week's intensity from the weeks before (newest first), last week's plan completion and stalls. */
export function weekIntensity(pastWeeks: readonly Pick<WeekPlan, "intensity">[], lastCompletion: number | null, stalledShare: number): WeekIntensity {
  const sinceDeload = pastWeeks.findIndex((w) => w.intensity === "deload");
  const weeksWithout = sinceDeload === -1 ? pastWeeks.length : sinceDeload;
  if (sinceDeload !== 0 && (weeksWithout >= DELOAD_EVERY - 1 || stalledShare >= STALL_SHARE)) return "deload";
  if (lastCompletion !== null && lastCompletion < 0.5) return "light";
  return "normal";
}

export interface PlanInput {
  weekStart: string;
  program: WorkoutProgram;
  sessions: readonly WorkoutSession[];
  /** Stored plans before this week, any order. */
  pastWeeks: readonly WeekPlan[];
}

/** The plan for `weekStart` with the feedback on the week before it. */
export function planWeek({ weekStart, program, sessions, pastWeeks }: PlanInput): WeekPlan {
  const before = newestFirst(sessions.filter((s) => s.performedOn < weekStart));
  const earlier = [...pastWeeks].filter((w) => w.weekStart < weekStart).sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  const lastWeekStart = addDays(weekStart, -7);
  const lastPlan = earlier.find((w) => w.weekStart === lastWeekStart) ?? null;
  const feedback = before.length > 0 ? reviewWeek(lastWeekStart, before, lastPlan) : null;
  const completion = feedback && feedback.sessionsPlanned ? feedback.sessionsDone / feedback.sessionsPlanned : null;

  const days = program.days.filter((d) => d.exercises.length > 0);
  const names = [...new Map(days.flatMap((d) => d.exercises).map((e) => [normalizeTr(e.name), e.name])).values()];
  const tracked = names.map((n) => exerciseHistory(n, before)).filter((h) => h.length > 0);
  const stalledShare = tracked.length >= 2 ? tracked.filter(isStalled).length / tracked.length : 0;
  const intensity = weekIntensity(earlier, completion, stalledShare);

  // The rotation goes on from the day after the last one done.
  const lastDone = before[0] ? days.findIndex((d) => normalizeTr(d.name) === normalizeTr(before[0].dayName)) : -1;
  const plannedDays: PlannedDay[] =
    days.length === 0
      ? []
      : trainingWeekdays(program).map((weekday, i) => {
          const day = days[(lastDone + 1 + i) % days.length];
          return { date: addDays(weekStart, weekday), name: day.name, exercises: day.exercises.map((e) => nextTarget(e, exerciseHistory(e.name, before), intensity)) };
        });

  return { weekStart, intensity, days: plannedDays, feedback };
}
