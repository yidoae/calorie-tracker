import { addMonths, dayKey, dayToDate, startOfMonth } from "@calorie/core/dates";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toAppError } from "@/services/errors";
import { getMonthTotals } from "@/services/mealService";
import { calendarDays, canGoForward, monthTitle } from "./historyLogic";
import { usePlans } from "./usePlans";
import { useSession } from "./useSession";
import { useToday } from "./useToday";

/**
 * The calendar (US5, FR-019): one month at a time, starting with the current one, each logged day
 * rated against the plan of that day. Logging, editing or deleting a meal invalidates ["meals"],
 * so the marks follow.
 */
export function useMonthCalendar() {
  const { localDate: today, timeZone } = useToday();
  const { session, status } = useSession();
  const [month, setMonth] = useState(() => startOfMonth(dayToDate(today)));
  const plans = usePlans();
  const totals = useQuery({
    queryKey: ["meals", session?.user.id ?? null, "month", dayKey(month)],
    queryFn: () => getMonthTotals(month),
    enabled: status === "ready",
  });
  const forward = canGoForward(month, today);
  const rows = totals.data ?? [];

  return {
    title: monthTitle(month),
    days: calendarDays(month, rows, plans.data ?? [], today, timeZone),
    hasMeals: rows.length > 0,
    canGoForward: forward,
    back: () => setMonth((m) => addMonths(m, -1)),
    forward: () => {
      if (forward) setMonth((m) => addMonths(m, 1));
    },
    loading: totals.isPending || plans.isPending,
    error: totals.error ? toAppError(totals.error) : plans.error ? toAppError(plans.error) : null,
    retry: () => {
      void totals.refetch();
      void plans.refetch();
    },
  };
}
