import { toAppError } from "@/services/errors";
import { dayTitle, dayTargets, isOpenableDay } from "./historyLogic";
import { dayTotals, groupBySlot } from "./mealLogic";
import { useDayMeals } from "./useDayMeals";
import { usePlans } from "./usePlans";
import { useToday } from "./useToday";

/**
 * A day from the calendar (US5): its meals and totals against that day's own targets. `valid` is
 * false for a malformed or future date in the link; the screen then shows an error instead.
 */
export function usePastDay(param: string | undefined) {
  const { localDate: today, timeZone } = useToday();
  const valid = isOpenableDay(param, today);
  const localDate = valid ? param : today;
  const plans = usePlans();
  const meals = useDayMeals(localDate);
  const list = meals.data ?? [];

  return {
    valid,
    title: valid ? dayTitle(localDate) : "Gün",
    resolved: plans.data === undefined ? null : dayTargets(plans.data, localDate, timeZone),
    eaten: dayTotals(list),
    groups: groupBySlot(list),
    loading: plans.isPending || meals.isPending,
    error: plans.error ? toAppError(plans.error) : meals.error ? toAppError(meals.error) : null,
    retry: () => {
      void plans.refetch();
      void meals.refetch();
    },
  };
}
