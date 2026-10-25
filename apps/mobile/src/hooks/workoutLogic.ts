import { LOCALE } from "@calorie/core/dates";
import type { StrengthSplit } from "@calorie/core/schemas/plan";
import {
  workoutProgramSchema,
  workoutSessionInputSchema,
  type ProgramDay,
  type WorkoutProgram,
  type WorkoutSession,
  type WorkoutSessionInput,
} from "@calorie/core/schemas/workout";
import { normalizeTr } from "@calorie/core/search/normalize";
import { parseNumber } from "./setupSteps";

/*
 * 007 workout rules with no React Native imports (tests/workoutLogic.test.ts): ready-made splits,
 * the program editor's text fields and the workout logger's set fields turned into validated
 * payloads, and each exercise's weight progress from the logged sessions.
 */

// ---------------------------------------------------------------------------------------------
// Ready-made splits

export type TemplateId = StrengthSplit | "broSplit" | "custom";

const ex = (name: string, sets: number, reps: string) => ({ name, sets, reps, kg: null });

const PUSH = [ex("Bench press", 4, "6-8"), ex("Incline dumbbell press", 3, "8-10"), ex("Shoulder press", 3, "8-10"), ex("Lateral raise", 3, "12-15"), ex("Triceps pushdown", 3, "10-12")];
const PULL = [ex("Lat pulldown", 4, "8-10"), ex("Barbell row", 4, "6-8"), ex("Seated cable row", 3, "10-12"), ex("Face pull", 3, "12-15"), ex("Biceps curl", 3, "10-12")];
const LEGS = [ex("Squat", 4, "5-8"), ex("Romanian deadlift", 3, "8-10"), ex("Leg press", 3, "10-12"), ex("Leg curl", 3, "10-12"), ex("Calf raise", 4, "12-15")];

export const TEMPLATES: { id: TemplateId; label: string; hint: string; program: WorkoutProgram }[] = [
  {
    id: "ppl",
    label: "Push / Pull / Legs",
    hint: "3 gün, haftada 3 ya da 6 antrenman",
    program: { name: "Push / Pull / Legs", split: "Push / Pull / Legs", days: [{ name: "Push", exercises: PUSH }, { name: "Pull", exercises: PULL }, { name: "Legs", exercises: LEGS }] },
  },
  {
    id: "upperLower",
    label: "Upper / Lower",
    hint: "2 gün, haftada 4 antrenman",
    program: {
      name: "Upper / Lower",
      split: "Upper / Lower",
      days: [
        { name: "Upper", exercises: [ex("Bench press", 4, "6-8"), ex("Barbell row", 4, "6-8"), ex("Shoulder press", 3, "8-10"), ex("Lat pulldown", 3, "8-10"), ex("Biceps curl", 2, "10-12"), ex("Triceps pushdown", 2, "10-12")] },
        { name: "Lower", exercises: [ex("Squat", 4, "5-8"), ex("Romanian deadlift", 3, "8-10"), ex("Leg press", 3, "10-12"), ex("Leg curl", 3, "10-12"), ex("Calf raise", 3, "12-15")] },
      ],
    },
  },
  {
    id: "fullBody",
    label: "Full body",
    hint: "A ve B günü sırayla, haftada 2–3 antrenman",
    program: {
      name: "Full body",
      split: "Full body",
      days: [
        { name: "Full body A", exercises: [ex("Squat", 3, "5"), ex("Bench press", 3, "5"), ex("Barbell row", 3, "5")] },
        { name: "Full body B", exercises: [ex("Deadlift", 1, "5"), ex("Shoulder press", 3, "5"), ex("Lat pulldown", 3, "8-10")] },
      ],
    },
  },
  {
    id: "broSplit",
    label: "Bölgesel (bro split)",
    hint: "Her gün bir bölge, haftada 5 antrenman",
    program: {
      name: "Bölgesel",
      split: "Bro split",
      days: [
        { name: "Göğüs", exercises: [ex("Bench press", 4, "6-8"), ex("Incline dumbbell press", 3, "8-10"), ex("Cable fly", 3, "12-15")] },
        { name: "Sırt", exercises: [ex("Barbell row", 4, "6-8"), ex("Lat pulldown", 3, "8-10"), ex("Seated cable row", 3, "10-12")] },
        { name: "Bacak", exercises: [ex("Squat", 4, "5-8"), ex("Leg press", 3, "10-12"), ex("Leg curl", 3, "10-12")] },
        { name: "Omuz", exercises: [ex("Shoulder press", 4, "8-10"), ex("Lateral raise", 4, "12-15"), ex("Face pull", 3, "12-15")] },
        { name: "Kol", exercises: [ex("Biceps curl", 4, "10-12"), ex("Triceps pushdown", 4, "10-12"), ex("Hammer curl", 3, "10-12")] },
      ],
    },
  },
  {
    id: "custom",
    label: "Kendi programım",
    hint: "Boş bir günle başla, hareketleri sen yaz",
    program: { name: "Programım", split: "Özel", days: [{ name: "Gün 1", exercises: [] }] },
  },
];

// ---------------------------------------------------------------------------------------------
// Numbers typed by the user

/** 62.5 → "62,5". */
export const formatKg = (kg: number) => kg.toLocaleString(LOCALE, { maximumFractionDigits: 2 });

// ---------------------------------------------------------------------------------------------
// Program editor: every field is text while the user types

export interface ExerciseDraft {
  name: string;
  sets: string;
  reps: string;
  kg: string;
}
interface DayDraft {
  name: string;
  exercises: ExerciseDraft[];
}
export interface ProgramDraft {
  name: string;
  split: string;
  days: DayDraft[];
}

export function programDraft(program: WorkoutProgram): ProgramDraft {
  return {
    name: program.name,
    split: program.split,
    days: program.days.map((d) => ({
      name: d.name,
      exercises: d.exercises.map((e) => ({ name: e.name, sets: String(e.sets), reps: e.reps, kg: e.kg === null ? "" : formatKg(e.kg) })),
    })),
  };
}

export const EMPTY_EXERCISE: ExerciseDraft = { name: "", sets: "3", reps: "8-12", kg: "" };

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

/** Where a schema issue is, in the user's words: "2. gün, 3. hareket". */
function issuePlace(path: PropertyKey[]): string {
  const day = path[0] === "days" && typeof path[1] === "number" ? `${path[1] + 1}. gün` : null;
  const exercise = path[2] === "exercises" && typeof path[3] === "number" ? `${path[3] + 1}. hareket` : null;
  return [day, exercise].filter(Boolean).join(", ");
}

const FIELD_NAMES: Record<string, string> = { name: "ad", split: "program tipi", sets: "set", reps: "tekrar", kg: "kg" };

/** "<place> · <field>: <message>", or the bare message when neither is known. */
function issueText(place: string | null, issue: { path: PropertyKey[]; message: string; code: string; expected?: unknown }): string {
  const field = FIELD_NAMES[String(issue.path.at(-1))];
  // Text that is not a number reaches the schema as NaN; zod's own text for it names the type.
  const message = issue.code === "invalid_type" && issue.expected === "number" ? "Bir sayı yaz" : issue.message;
  return [place, field && `${field}: ${message}`].filter(Boolean).join(" · ") || message;
}

/** The draft as a program the database accepts, or the first problem in Turkish. */
export function programFromDraft(draft: ProgramDraft): Result<WorkoutProgram> {
  const candidate = {
    name: draft.name,
    split: draft.split,
    days: draft.days.map((d) => ({
      name: d.name,
      exercises: d.exercises.map((e) => ({ name: e.name, sets: parseNumber(e.sets) ?? Number.NaN, reps: e.reps, kg: e.kg.trim() === "" ? null : (parseNumber(e.kg) ?? Number.NaN) })),
    })),
  };
  const parsed = workoutProgramSchema.safeParse(candidate);
  if (parsed.success) return { ok: true, value: parsed.data };
  const issue = parsed.error.issues[0];
  return { ok: false, error: issueText(issuePlace(issue.path), issue) };
}

// ---------------------------------------------------------------------------------------------
// Workout logger

export interface SetDraft {
  kg: string;
  reps: string;
}
interface LoggedExerciseDraft {
  name: string;
  /** The program's target, e.g. "4 × 6-8 · 60 kg". */
  target: string;
  sets: SetDraft[];
}
export interface SessionDraft {
  dayName: string;
  exercises: LoggedExerciseDraft[];
}

const sameExercise = (a: string, b: string) => normalizeTr(a) === normalizeTr(b);

/** Newest first: by date, then by when it was saved. */
const newestFirst = (sessions: readonly WorkoutSession[]) =>
  [...sessions].sort((a, b) => b.performedOn.localeCompare(a.performedOn) || b.createdAt.localeCompare(a.createdAt));

/**
 * The fields for a program day: each exercise starts from the sets done last time (to beat
 * them), or from the program's targets when it was never logged.
 */
export function sessionDraft(day: ProgramDay, history: readonly WorkoutSession[]): SessionDraft {
  const done = newestFirst(history).flatMap((s) => s.exercises);
  return {
    dayName: day.name,
    exercises: day.exercises.map((e) => {
      const last = done.find((d) => sameExercise(d.name, e.name));
      const firstReps = /\d+/.exec(e.reps)?.[0] ?? "";
      const sets = last
        ? last.sets.map((s) => ({ kg: formatKg(s.kg), reps: String(s.reps) }))
        : Array.from({ length: e.sets }, () => ({ kg: e.kg === null ? "" : formatKg(e.kg), reps: firstReps }));
      return { name: e.name, target: `${e.sets} × ${e.reps}${e.kg === null ? "" : ` · ${formatKg(e.kg)} kg`}`, sets };
    }),
  };
}

/**
 * The workout to save: sets with both fields filled, exercises with at least one such set (an
 * exercise left empty was skipped). An error in Turkish when a set is half filled, nothing was
 * filled or a number is off.
 */
export function sessionFromDraft(draft: SessionDraft, performedOn: string): Result<WorkoutSessionInput> {
  for (const e of draft.exercises) {
    const half = e.sets.findIndex((s) => (s.kg.trim() === "") !== (s.reps.trim() === ""));
    if (half >= 0) return { ok: false, error: `${e.name} · ${half + 1}. sette kilo ve tekrar ikisi de dolu olmalı` };
  }
  const exercises = draft.exercises
    .map((e) => ({
      name: e.name,
      sets: e.sets
        .filter((s) => s.kg.trim() !== "" && s.reps.trim() !== "")
        .map((s) => ({ kg: parseNumber(s.kg) ?? Number.NaN, reps: parseNumber(s.reps) ?? Number.NaN })),
    }))
    .filter((e) => e.sets.length > 0);
  if (exercises.length === 0) return { ok: false, error: "En az bir sete kilo ve tekrar yaz." };
  const parsed = workoutSessionInputSchema.safeParse({ performedOn, dayName: draft.dayName, exercises });
  if (parsed.success) return { ok: true, value: parsed.data };
  const issue = parsed.error.issues[0];
  const exercise = issue.path[0] === "exercises" && typeof issue.path[1] === "number" ? exercises[issue.path[1]].name : null;
  return { ok: false, error: issueText(exercise, issue) };
}

// ---------------------------------------------------------------------------------------------
// Weight progress

export interface ProgressEntry {
  date: string;
  /** The heaviest set (more reps wins a tie). */
  topKg: number;
  topReps: number;
  /** Estimated one-rep max (Epley) of the session's best set. */
  e1rm: number;
  /** Σ kg × reps. */
  volume: number;
}

export interface ExerciseProgress {
  name: string;
  /** Oldest first. */
  entries: ProgressEntry[];
  bestKg: number;
  bestE1rm: number;
  lastDate: string;
}

/** Epley: kg × (1 + reps / 30), the lift itself for a single; rounded to 0.5 kg. */
export function estimatedMax(kg: number, reps: number): number {
  const max = reps === 1 ? kg : kg * (1 + reps / 30);
  return Math.round(max * 2) / 2;
}

/** Every logged exercise with its history, the most recently done first. */
export function exerciseProgress(sessions: readonly WorkoutSession[]): ExerciseProgress[] {
  const byExercise = new Map<string, ExerciseProgress>();
  for (const s of newestFirst(sessions).reverse()) {
    for (const e of s.exercises) {
      const top = e.sets.reduce((best, set) => (set.kg > best.kg || (set.kg === best.kg && set.reps > best.reps) ? set : best));
      const entry: ProgressEntry = {
        date: s.performedOn,
        topKg: top.kg,
        topReps: top.reps,
        e1rm: Math.max(...e.sets.map((set) => estimatedMax(set.kg, set.reps))),
        volume: e.sets.reduce((sum, set) => sum + set.kg * set.reps, 0),
      };
      const key = normalizeTr(e.name);
      const known = byExercise.get(key);
      if (known) {
        known.entries.push(entry);
        known.bestKg = Math.max(known.bestKg, entry.topKg);
        known.bestE1rm = Math.max(known.bestE1rm, entry.e1rm);
        known.lastDate = entry.date;
      } else {
        byExercise.set(key, { name: e.name, entries: [entry], bestKg: entry.topKg, bestE1rm: entry.e1rm, lastDate: entry.date });
      }
    }
  }
  return [...byExercise.values()].sort((a, b) => b.lastDate.localeCompare(a.lastDate));
}
