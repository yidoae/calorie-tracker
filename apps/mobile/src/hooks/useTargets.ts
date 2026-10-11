import { resolveTargets, type ResolvedTargets } from "@calorie/core/nutrition/targets";
import { toAppError, type AppError } from "@/services/errors";
import { useActivePlan } from "./useActivePlan";

interface TargetsState {
  /** Null while the plan loads or when it could not be loaded. */
  resolved: ResolvedTargets | null;
  loading: boolean;
  error: AppError | null;
  retry: () => void;
}

/** Today's targets from the active plan: the training- or rest-day targets when it cycles (FR-011). */
export function useTargets(date: Date = new Date()): TargetsState {
  const plan = useActivePlan();
  return {
    resolved: plan.data === undefined ? null : resolveTargets(plan.data, date),
    loading: plan.isPending,
    error: plan.error ? toAppError(plan.error) : null,
    retry: () => void plan.refetch(),
  };
}
