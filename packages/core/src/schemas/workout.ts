import { dayKeySchema } from "./meal.ts";
import { z } from "./zod.ts";

/*
 * 007 workout programs and logged sessions (specs/007-workout/data-model.md). A program is the
 * user's split ("Push / Pull / Legs", "Upper / Lower" or their own) as days of exercises with
 * targets; a session is one workout: the day's name and each exercise's kg × reps sets. The
 * limits match the database checks in 20261025000100_workouts.sql.
 */

export const WORKOUT_LIMITS = {
  days: { min: 1, max: 7 },
  exercisesPerDay: 15,
  setsPerExercise: 10,
  kg: 500,
  reps: 100,
} as const;

const name = (max: number) => z.string().trim().min(1, "Bir ad yaz").max(max, `En fazla ${max} karakter`);
const kg = z.number().min(0).max(WORKOUT_LIMITS.kg);

/** One exercise of a program day with its targets; reps is free text ("8-12", "5", "AMRAP"). */
export const programExerciseSchema = z.object({
  name: name(60),
  sets: z.number().int().min(1).max(WORKOUT_LIMITS.setsPerExercise),
  reps: z.string().trim().min(1).max(12),
  kg: kg.nullable(),
});
export type ProgramExercise = z.output<typeof programExerciseSchema>;

export const programDaySchema = z.object({
  name: name(40),
  exercises: z.array(programExerciseSchema).max(WORKOUT_LIMITS.exercisesPerDay),
});
export type ProgramDay = z.output<typeof programDaySchema>;

export const workoutProgramSchema = z.object({
  name: name(60),
  split: name(40),
  days: z.array(programDaySchema).min(WORKOUT_LIMITS.days.min).max(WORKOUT_LIMITS.days.max),
  /** 008: training weekdays, Monday = 0; empty spreads the days over the week (workout/plan.ts). */
  weekdays: z
    .array(z.number().int().min(0).max(6))
    .max(7)
    .refine((d) => new Set(d).size === d.length, "Günler tekrar edemez")
    .default([]),
});
export type WorkoutProgram = z.output<typeof workoutProgramSchema>;

export const workoutSetSchema = z.object({
  kg,
  reps: z.number().int().min(1).max(WORKOUT_LIMITS.reps),
});
export type WorkoutSet = z.output<typeof workoutSetSchema>;

export const sessionExerciseSchema = z.object({
  name: name(60),
  sets: z.array(workoutSetSchema).min(1).max(WORKOUT_LIMITS.setsPerExercise),
});
export type SessionExercise = z.output<typeof sessionExerciseSchema>;

/** What the app sends to log a workout. */
export const workoutSessionInputSchema = z.object({
  performedOn: dayKeySchema,
  dayName: name(40),
  exercises: z.array(sessionExerciseSchema).min(1).max(30),
});
export type WorkoutSessionInput = z.output<typeof workoutSessionInputSchema>;

/** A stored workout; the database returns the snake_case row. */
export const workoutSessionRowSchema = z
  .object({
    id: z.uuid(),
    performed_on: dayKeySchema,
    day_name: z.string(),
    exercises: z.array(sessionExerciseSchema),
    created_at: z.string(),
  })
  .transform((r) => ({ id: r.id, performedOn: r.performed_on, dayName: r.day_name, exercises: r.exercises, createdAt: r.created_at }));
export type WorkoutSession = z.output<typeof workoutSessionRowSchema>;

// ---------------------------------------------------------------------------------------------
// 008 weekly plan and feedback (specs/008-weekly-plan/data-model.md)

/** normal: progress; light: hold weights after a missed week; deload: about −10 % and one set fewer. */
export const WEEK_INTENSITIES = ["normal", "light", "deload"] as const;
export type WeekIntensity = (typeof WEEK_INTENSITIES)[number];

/** Why a target moved: first time, more kg, one more rep, same, or lighter for a deload. */
export const TARGET_CHANGES = ["new", "up_kg", "up_reps", "hold", "deload"] as const;
export type TargetChange = (typeof TARGET_CHANGES)[number];

export const plannedExerciseSchema = programExerciseSchema.extend({ change: z.enum(TARGET_CHANGES) });
export type PlannedExercise = z.output<typeof plannedExerciseSchema>;

export const plannedDaySchema = z.object({
  date: dayKeySchema,
  name: name(40),
  exercises: z.array(plannedExerciseSchema).max(WORKOUT_LIMITS.exercisesPerDay),
});
export type PlannedDay = z.output<typeof plannedDaySchema>;

/** The look back at a finished week, shown with the next week's plan. */
export const weekFeedbackSchema = z.object({
  weekStart: dayKeySchema,
  sessionsDone: z.number().int().min(0),
  sessionsPlanned: z.number().int().min(0).nullable(),
  /** Σ kg × reps of the week. */
  volume: z.number().min(0),
  /** Against the week before, rounded %; null when that week had no volume. */
  volumeChangePct: z.number().nullable(),
  records: z.array(z.object({ name: z.string(), kg, reps: z.number().int() })),
  stalled: z.array(z.string()),
  headline: z.string(),
  notes: z.array(z.string()),
});
export type WeekFeedback = z.output<typeof weekFeedbackSchema>;

export const weekPlanSchema = z.object({
  weekStart: dayKeySchema,
  intensity: z.enum(WEEK_INTENSITIES),
  days: z.array(plannedDaySchema).max(7),
  feedback: weekFeedbackSchema.nullable(),
});
export type WeekPlan = z.output<typeof weekPlanSchema>;

/** A stored week (workout_weeks); `plan` holds the days. */
export const workoutWeekRowSchema = z
  .object({
    week_start: dayKeySchema,
    intensity: z.enum(WEEK_INTENSITIES),
    plan: z.array(plannedDaySchema),
    feedback: weekFeedbackSchema.nullable(),
  })
  .transform((r): WeekPlan => ({ weekStart: r.week_start, intensity: r.intensity, days: r.plan, feedback: r.feedback }));
