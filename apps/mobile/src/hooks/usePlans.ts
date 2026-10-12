import { useQuery } from "@tanstack/react-query";
import { getPlans } from "@/services/planService";
import { useSession } from "./useSession";

/** All of the user's plans, the history included; refetched when a plan is saved (["plans"]). */
export function usePlans() {
  const { session, status } = useSession();
  return useQuery({
    queryKey: ["plans", session?.user.id ?? null],
    queryFn: getPlans,
    enabled: status === "ready",
  });
}
