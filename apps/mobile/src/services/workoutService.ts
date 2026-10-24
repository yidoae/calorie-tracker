import {
  workoutProgramSchema,
  workoutSessionInputSchema,
  workoutSessionRowSchema,
  type WorkoutProgram,
  type WorkoutSession,
  type WorkoutSessionInput,
} from "@calorie/core/schemas/workout";
import { toAppError } from "./errors";
import { supabase } from "./supabase";

/*
 * 007: the user's one workout program and their logged workouts (specs/007-workout/data-model.md).
 * RLS limits every read to the user's own rows; the owner column comes from the token.
 */

/** The user's program; null until they save one. */
export async function getProgram(): Promise<WorkoutProgram | null> {
  const { data, error } = await supabase.from("workout_programs").select("name, split, days").maybeSingle();
  if (error) throw toAppError(error);
  return data === null ? null : workoutProgramSchema.parse(data);
}

/** Writes the program, replacing the previous one. */
export async function saveProgram(program: WorkoutProgram): Promise<WorkoutProgram> {
  const { data, error } = await supabase.from("workout_programs").upsert(workoutProgramSchema.parse(program), { onConflict: "user_id" }).select("name, split, days").single();
  if (error) throw toAppError(error);
  return workoutProgramSchema.parse(data);
}

/** The latest workouts, newest first; enough for every exercise's progress chart. */
export async function getSessions(limit = 300): Promise<WorkoutSession[]> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("id, performed_on, day_name, exercises, created_at")
    .order("performed_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw toAppError(error);
  return workoutSessionRowSchema.array().parse(data);
}

export async function logSession(session: WorkoutSessionInput): Promise<WorkoutSession> {
  const s = workoutSessionInputSchema.parse(session);
  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({ performed_on: s.performedOn, day_name: s.dayName, exercises: s.exercises })
    .select("id, performed_on, day_name, exercises, created_at")
    .single();
  if (error) throw toAppError(error);
  return workoutSessionRowSchema.parse(data);
}

export async function deleteSession(id: string): Promise<void> {
  const { error } = await supabase.from("workout_sessions").delete().eq("id", id);
  if (error) throw toAppError(error);
}
