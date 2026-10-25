import { dayKey, dayToDate, LOCALE } from "../dates.ts";
import type { WeekFeedback, WeekPlan, WorkoutSession, WorkoutSet } from "../schemas/workout.ts";
import { normalizeTr } from "../search/normalize.ts";
import { findExercise, MUSCLE_LABELS, type MuscleGroup } from "./exercises.ts";

/*
 * 008: the look back at a finished training week, from the logged weights only: workouts done
 * against the plan, volume against the week before, new records, and exercises that stopped
 * moving. Rule-based and pure, so the same numbers show on every device (specs/008-weekly-plan).
 */

/** How many workouts in a row without a better estimated max count as a stall. */
export const STALL_SESSIONS = 3;

export const addDays = (day: string, n: number) => {
  const d = dayToDate(day);
  d.setDate(d.getDate() + n);
  return dayKey(d);
};

/** Monday = 0 … Sunday = 6. */
export const weekdayOf = (day: string) => (dayToDate(day).getDay() + 6) % 7;

export const mondayOf = (day: string) => addDays(day, -weekdayOf(day));

/** Epley: kg × (1 + reps / 30), the lift itself for a single; rounded to 0.5 kg. */
export function estimatedMax(kg: number, reps: number): number {
  const max = reps === 1 ? kg : kg * (1 + reps / 30);
  return Math.round(max * 2) / 2;
}

const bestOf = (sets: readonly WorkoutSet[]) => Math.max(...sets.map((s) => estimatedMax(s.kg, s.reps)));
const volumeOf = (sessions: readonly WorkoutSession[]) =>
  sessions.reduce((sum, s) => sum + s.exercises.reduce((v, e) => v + e.sets.reduce((x, set) => x + set.kg * set.reps, 0), 0), 0);

/** Newest first: by date, then by when it was saved. */
export const newestFirst = (sessions: readonly WorkoutSession[]) =>
  [...sessions].sort((a, b) => b.performedOn.localeCompare(a.performedOn) || b.createdAt.localeCompare(a.createdAt));

/** Every logged set list of one exercise, newest workout first (names match without case or Turkish letters). */
export function exerciseHistory(name: string, sessionsNewestFirst: readonly WorkoutSession[]): WorkoutSet[][] {
  const key = normalizeTr(name);
  return sessionsNewestFirst.flatMap((s) => s.exercises.filter((e) => normalizeTr(e.name) === key && e.sets.length > 0).map((e) => e.sets));
}

/** No better estimated max in the last three workouts of the exercise than three workouts ago. */
export function isStalled(history: readonly WorkoutSet[][]): boolean {
  if (history.length < STALL_SESSIONS) return false;
  return bestOf(history[0]) <= bestOf(history[STALL_SESSIONS - 1]);
}

const kgText = (kg: number) => kg.toLocaleString(LOCALE, { maximumFractionDigits: 2 });

export function reviewWeek(weekStart: string, sessions: readonly WorkoutSession[], plan: WeekPlan | null): WeekFeedback {
  const end = addDays(weekStart, 6);
  const sorted = newestFirst(sessions);
  const inWeek = sorted.filter((s) => s.performedOn >= weekStart && s.performedOn <= end);
  const before = sorted.filter((s) => s.performedOn < weekStart);
  const weekBefore = before.filter((s) => s.performedOn >= addDays(weekStart, -7));

  const volume = volumeOf(inWeek);
  const previous = volumeOf(weekBefore);
  const volumeChangePct = previous > 0 ? Math.round((volume / previous - 1) * 100) : null;

  const names = [...new Map(inWeek.flatMap((s) => s.exercises).map((e) => [normalizeTr(e.name), e.name])).values()];
  const records: WeekFeedback["records"] = [];
  const stalled: string[] = [];
  for (const name of names) {
    const thisWeek = exerciseHistory(name, inWeek).flat();
    const earlier = exerciseHistory(name, before);
    if (earlier.length > 0 && bestOf(thisWeek) > Math.max(...earlier.map(bestOf))) {
      const top = thisWeek.reduce((a, b) => (estimatedMax(b.kg, b.reps) > estimatedMax(a.kg, a.reps) ? b : a));
      records.push({ name, kg: top.kg, reps: top.reps });
    }
    if (isStalled(exerciseHistory(name, sorted.filter((s) => s.performedOn <= end)))) stalled.push(name);
  }

  const done = inWeek.length;
  const planned = plan ? plan.days.length : null;
  const headline =
    done === 0
      ? "Bu hafta antrenman kaydı yok."
      : planned !== null && planned > 0
        ? done >= planned
          ? `Planlanan ${planned} antrenmanın hepsi yapıldı.`
          : `Planlanan ${planned} antrenmandan ${done} tanesi yapıldı.`
        : `${done} antrenman yapıldı.`;

  const notes: string[] = [];
  for (const r of records.slice(0, 3)) notes.push(`Yeni rekor: ${r.name} ${kgText(r.kg)} kg × ${r.reps}`);
  if (volumeChangePct !== null && done > 0) {
    notes.push(
      Math.abs(volumeChangePct) < 5
        ? "Toplam hacim geçen haftayla aynı seviyede."
        : `Toplam hacim geçen haftaya göre %${Math.abs(volumeChangePct)} ${volumeChangePct > 0 ? "arttı" : "azaldı"}.`,
    );
  }
  if (stalled.length > 0) notes.push(`${stalled.join(", ")}: son ${STALL_SESSIONS} antrenmanda ilerleme yok.`);

  const perMuscle = new Map<MuscleGroup, number>();
  for (const x of inWeek.flatMap((s) => s.exercises)) {
    const muscle = findExercise(x.name)?.muscle;
    if (muscle && x.sets.length > 0) perMuscle.set(muscle, (perMuscle.get(muscle) ?? 0) + x.sets.length);
  }
  const muscleSets = [...perMuscle].map(([muscle, sets]) => ({ muscle, sets })).sort((a, b) => b.sets - a.sets);
  if (muscleSets.length > 0) notes.push(`Bölgelere göre set: ${muscleSets.map((m) => `${MUSCLE_LABELS[m.muscle]} ${m.sets}`).join(", ")}`);

  return { weekStart, sessionsDone: done, sessionsPlanned: planned, volume, volumeChangePct, records, stalled, headline, notes, muscleSets };
}
