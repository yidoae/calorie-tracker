import { useQuery } from "@tanstack/react-query";
import { getDayMeals } from "@/services/mealService";
import { useSession } from "./useSession";

/** The user's meals on a local day (`YYYY-MM-DD`); refetched whenever a meal changes (["meals"]). */
export function useDayMeals(localDate: string) {
  const { session, status } = useSession();
  return useQuery({
    queryKey: ["meals", session?.user.id ?? null, localDate],
    queryFn: () => getDayMeals(localDate),
    enabled: status === "ready",
  });
}
