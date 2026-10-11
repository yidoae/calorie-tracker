import { dayToDate } from "@calorie/core/dates";
import { toAppError } from "@/services/errors";
import { dayTotals, groupBySlot } from "./mealLogic";
import { useDayMeals } from "./useDayMeals";
import { useTargets } from "./useTargets";
import { useToday } from "./useToday";

/**
 * Today on the dashboard (FR-018): the day's targets from the active plan, what was eaten (the sum
 * of the meals' server-computed totals) and the meals under their slots. Logging, editing or
 * deleting a meal invalidates ["meals"], so this follows within a moment.
 */
export function useDashboard() {
  const { localDate } = useToday();
  const targets = useTargets(dayToDate(localDate));
  const meals = useDayMeals(localDate);
  const list = meals.data ?? [];

  return {
    resolved: targets.resolved,
    eaten: dayTotals(list),
    groups: groupBySlot(list),
    loading: targets.loading || meals.isPending,
    error: targets.error ?? (meals.error ? toAppError(meals.error) : null),
    retry: () => {
      targets.retry();
      void meals.refetch();
    },
  };
}
