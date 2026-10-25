import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { WORKOUT_LIMITS } from "@calorie/core/schemas/workout";
import { toAppError } from "@/services/errors";
import { logSession } from "@/services/workoutService";
import { useToast } from "./useToast";
import { useToday } from "./useToday";
import { canMarkDone, REST_SECONDS, restLeft, sessionFromDraft, setProgress, type SessionDraft, type SetDraft } from "./workoutLogic";

/**
 * Logging one workout (007): the day's exercises with kg × reps fields prefilled from the last
 * time, sets added or removed, each marked done with ✓ (K6), which starts a 90 s rest that can be
 * skipped. Only done sets are saved, for today.
 */
export function useWorkoutLogger(initial: SessionDraft) {
  const [draft, setDraft] = useState(initial);
  const [problem, setProblem] = useState<string | null>(null);
  const { localDate } = useToday();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const restSeconds = restEndsAt === null ? 0 : restLeft(restEndsAt, now);

  // Ticks once a second while resting; the rest ends by itself at 0.
  useEffect(() => {
    if (restEndsAt === null) return;
    const timer = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= restEndsAt) setRestEndsAt(null);
    }, 1000);
    return () => clearInterval(timer);
  }, [restEndsAt]);

  const mutation = useMutation({
    mutationFn: logSession,
    onSuccess: (s) => {
      void queryClient.invalidateQueries({ queryKey: ["workoutSessions"] });
      const sets = s.exercises.reduce((n, e) => n + e.sets.length, 0);
      toast.show("success", "Antrenman kaydedildi", `${s.dayName} · ${s.exercises.length} hareket, ${sets} set`);
    },
  });

  const editSets = (exercise: number, change: (sets: SetDraft[]) => SetDraft[]) =>
    setDraft((d) => ({ ...d, exercises: d.exercises.map((e, i) => (i === exercise ? { ...e, sets: change(e.sets) } : e)) }));

  return {
    draft,
    setField: (exercise: number, set: number, field: "kg" | "reps", value: string) =>
      editSets(exercise, (sets) => sets.map((s, i) => (i === set ? { ...s, [field]: value } : s))),
    canAddSet: (exercise: number) => draft.exercises[exercise].sets.length < WORKOUT_LIMITS.setsPerExercise,
    /** A new set copies the one above it, the usual next set. */
    addSet: (exercise: number) => editSets(exercise, (sets) => [...sets, { ...(sets.at(-1) ?? { kg: "", reps: "" }), done: false }]),
    canMarkDone,
    /** ✓ on a set: done (and the rest starts) or back to not done. */
    toggleDone: (exercise: number, set: number) => {
      const marking = !draft.exercises[exercise].sets[set].done;
      editSets(exercise, (sets) => sets.map((s, i) => (i === set ? { ...s, done: marking } : s)));
      if (marking) {
        setNow(Date.now());
        setRestEndsAt(Date.now() + REST_SECONDS * 1000);
      }
    },
    progress: setProgress(draft),
    /** Seconds of rest left; 0 when not resting. */
    restSeconds,
    skipRest: () => setRestEndsAt(null),
    removeSet: (exercise: number, set: number) => editSets(exercise, (sets) => sets.filter((_, i) => i !== set)),
    problem,
    /** Saves the workout for today; true when it was saved. */
    save: async (): Promise<boolean> => {
      if (mutation.isPending) return false;
      const result = sessionFromDraft(draft, localDate);
      setProblem(result.ok ? null : result.error);
      if (!result.ok) return false;
      try {
        await mutation.mutateAsync(result.value);
        return true;
      } catch {
        return false;
      }
    },
    pending: mutation.isPending,
    error: mutation.error ? toAppError(mutation.error) : null,
  };
}
