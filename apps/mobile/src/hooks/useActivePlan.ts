import { useQuery } from "@tanstack/react-query";
import { getActivePlan } from "@/services/planService";
import { useSession } from "./useSession";

/** The signed-in user's active plan; loaded once the setup is complete. */
export function useActivePlan() {
  const { session, status } = useSession();
  return useQuery({
    queryKey: ["activePlan", session?.user.id ?? null],
    queryFn: getActivePlan,
    enabled: status === "ready",
  });
}
