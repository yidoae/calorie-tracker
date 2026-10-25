import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { WORKOUT_LIMITS, type WorkoutProgram } from "@calorie/core/schemas/workout";
import { toAppError } from "@/services/errors";
import { saveProgram } from "@/services/workoutService";
import { useToast } from "./useToast";
import { EMPTY_EXERCISE, programDraft, programFromDraft, TEMPLATES, toggleWeekday, type ExerciseDraft, type ProgramDraft, type TemplateId } from "./workoutLogic";

/**
 * The program editor (007): starts from the saved program or a ready-made split, lets the user
 * rename the split and its days, add and remove days and exercises, type targets, and saves the
 * whole program at once.
 */
export function useProgramEditor(initial: ProgramDraft) {
  const [draft, setDraft] = useState(initial);
  const [template, setTemplate] = useState<TemplateId | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const toast = useToast();

  const mutation = useMutation({
    mutationFn: saveProgram,
    onSuccess: (program) => {
      void queryClient.invalidateQueries({ queryKey: ["workoutProgram"] });
      toast.show("success", "Program kaydedildi", `${program.split} · ${program.days.length} gün`);
    },
  });

  const editDay = (day: number, change: (d: ProgramDraft["days"][number]) => ProgramDraft["days"][number]) =>
    setDraft((d) => ({ ...d, days: d.days.map((x, i) => (i === day ? change(x) : x)) }));

  return {
    draft,
    template,
    /** Replaces the whole draft with a ready-made split. */
    applyTemplate: (id: TemplateId) => {
      setTemplate(id);
      setDraft(programDraft(TEMPLATES.find((t) => t.id === id)!.program));
      setProblem(null);
    },
    setName: (name: string) => setDraft((d) => ({ ...d, name })),
    setSplit: (split: string) => setDraft((d) => ({ ...d, split })),
    /** 008: a training weekday on or off (Monday = 0). */
    toggleWeekday: (day: number) => setDraft((d) => ({ ...d, weekdays: toggleWeekday(d.weekdays, day) })),
    canAddDay: draft.days.length < WORKOUT_LIMITS.days.max,
    addDay: () => setDraft((d) => ({ ...d, days: [...d.days, { name: `Gün ${d.days.length + 1}`, exercises: [] }] })),
    removeDay: (day: number) => setDraft((d) => ({ ...d, days: d.days.filter((_, i) => i !== day) })),
    setDayName: (day: number, name: string) => editDay(day, (d) => ({ ...d, name })),
    canAddExercise: (day: number) => draft.days[day].exercises.length < WORKOUT_LIMITS.exercisesPerDay,
    addExercise: (day: number) => editDay(day, (d) => ({ ...d, exercises: [...d.exercises, { ...EMPTY_EXERCISE }] })),
    removeExercise: (day: number, index: number) => editDay(day, (d) => ({ ...d, exercises: d.exercises.filter((_, i) => i !== index) })),
    setExercise: (day: number, index: number, field: keyof ExerciseDraft, value: string) =>
      editDay(day, (d) => ({ ...d, exercises: d.exercises.map((e, i) => (i === index ? { ...e, [field]: value } : e)) })),
    problem,
    /** Saves the program; the saved program, or null when it was not saved. */
    save: async (): Promise<WorkoutProgram | null> => {
      if (mutation.isPending) return null;
      const result = programFromDraft(draft);
      setProblem(result.ok ? null : result.error);
      if (!result.ok) return null;
      try {
        return await mutation.mutateAsync(result.value);
      } catch {
        return null;
      }
    },
    pending: mutation.isPending,
    error: mutation.error ? toAppError(mutation.error) : null,
  };
}
