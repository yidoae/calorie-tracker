import type { WeekPlan } from "@calorie/core/schemas/workout";
import { planWeek, weeksDue } from "@calorie/core/workout/plan";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { toAppError } from "@/services/errors";
import { getWeeks, saveWeek } from "@/services/workoutService";
import { useSession } from "./useSession";
import { useToday } from "./useToday";
import { useWorkoutProgram, useWorkoutSessions } from "./useWorkout";

/**
 * The weekly training plan (008): this week's plan, and from Sunday 18:00 next week's, each with
 * the feedback on the week before. A week without a stored plan gets one as soon as the program,
 * the workouts and the stored weeks are loaded; another device's plan is never overwritten.
 * `replan` rebuilds the due weeks after a program change.
 */
export function useWeeklyPlan() {
  const { session, status } = useSession();
  const queryClient = useQueryClient();
  const program = useWorkoutProgram();
  const log = useWorkoutSessions();
  const { localDate } = useToday();
  const weeks = useQuery({
    queryKey: ["workoutWeeks", session?.user.id ?? null],
    queryFn: () => getWeeks(),
    enabled: status === "ready",
  });

  const due = weeksDue(localDate, new Date().getHours());
  const stored = (start: string | undefined): WeekPlan | null => (start && weeks.data?.find((w) => w.weekStart === start)) || null;
  const missing = due.filter((start) => !stored(start));

  const build = useMutation({
    mutationFn: async ({ starts, replace }: { starts: string[]; replace: boolean }) => {
      if (!program.data) return;
      const past = [...(weeks.data ?? [])];
      for (const weekStart of starts) {
        const plan = planWeek({ weekStart, program: program.data, sessions: log.sessions, pastWeeks: past });
        await saveWeek(plan, replace);
        past.push(plan);
      }
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ["workoutWeeks"] }),
  });

  const ready = Boolean(program.data) && !log.loading && !log.loadError && weeks.isSuccess;
  const missingKey = missing.join();
  // The weeks already tried: a week that falls due while the app stays open (Sunday 18:00, Monday
  // 00:00) is still built, but a failure is not retried in a loop.
  const tried = useRef("");
  const { mutate, isPending } = build;
  useEffect(() => {
    // One try per missing set of weeks; a failure waits for `replan` or the next app start.
    if (!ready || !missingKey || isPending || tried.current === missingKey) return;
    tried.current = missingKey;
    mutate({ starts: missingKey.split(","), replace: false });
  }, [ready, missingKey, isPending, mutate]);

  return {
    hasProgram: Boolean(program.data),
    thisWeek: stored(due[0]),
    /** Only from Sunday 18:00. */
    nextWeek: stored(due[1]),
    today: localDate,
    loading: program.isPending || log.loading || weeks.isPending || build.isPending,
    error: weeks.error ? toAppError(weeks.error) : build.error ? toAppError(build.error) : null,
    /** Rebuilds the due weeks from the current program (after an edit); true when stored. */
    replan: () => build.mutateAsync({ starts: due, replace: true }).then(() => true, () => false),
  };
}
