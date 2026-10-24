import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { toAppError } from "@/services/errors";
import { deleteSession, getProgram, getSessions } from "@/services/workoutService";
import { useSession } from "./useSession";
import { exerciseProgress } from "./workoutLogic";

/** The user's workout program; null until one is saved. Refetched when it is saved (["workoutProgram"]). */
export function useWorkoutProgram() {
  const { session, status } = useSession();
  return useQuery({
    queryKey: ["workoutProgram", session?.user.id ?? null],
    queryFn: getProgram,
    enabled: status === "ready",
  });
}

/** The logged workouts, newest first, and each exercise's weight progress; refetched after a save (["workoutSessions"]). */
export function useWorkoutSessions() {
  const { session, status } = useSession();
  const queryClient = useQueryClient();
  const sessions = useQuery({
    queryKey: ["workoutSessions", session?.user.id ?? null],
    queryFn: () => getSessions(),
    enabled: status === "ready",
  });
  const progress = useMemo(() => exerciseProgress(sessions.data ?? []), [sessions.data]);
  const remove = useMutation({
    mutationFn: deleteSession,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["workoutSessions"] }),
  });

  return {
    sessions: sessions.data ?? [],
    progress,
    loading: sessions.isPending,
    loadError: sessions.error ? toAppError(sessions.error) : null,
    retry: () => void sessions.refetch(),
    remove: (id: string) => remove.mutateAsync(id).then(() => true, () => false),
    removeError: remove.error ? toAppError(remove.error) : null,
  };
}
