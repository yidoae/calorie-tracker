import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { WORKOUT_LIMITS } from "@calorie/core/schemas/workout";
import { toAppError } from "@/services/errors";
import { logSession } from "@/services/workoutService";
import { useToast } from "./useToast";
import { useToday } from "./useToday";
import { sessionFromDraft, type SessionDraft, type SetDraft } from "./workoutLogic";

/**
 * Logging one workout (007): the day's exercises with kg × reps fields prefilled from the last
 * time, sets added or removed, saved for today. Untouched exercises are left out.
 */
export function useWorkoutLogger(initial: SessionDraft) {
  const [draft, setDraft] = useState(initial);
  const [problem, setProblem] = useState<string | null>(null);
  const { localDate } = useToday();
  const queryClient = useQueryClient();
  const toast = useToast();

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
    setField: (exercise: number, set: number, field: keyof SetDraft, value: string) =>
      editSets(exercise, (sets) => sets.map((s, i) => (i === set ? { ...s, [field]: value } : s))),
    canAddSet: (exercise: number) => draft.exercises[exercise].sets.length < WORKOUT_LIMITS.setsPerExercise,
    /** A new set copies the one above it, the usual next set. */
    addSet: (exercise: number) => editSets(exercise, (sets) => [...sets, { ...(sets.at(-1) ?? { kg: "", reps: "" }) }]),
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
