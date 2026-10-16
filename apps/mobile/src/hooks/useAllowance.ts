import { useQuery } from "@tanstack/react-query";
import { allowance } from "@/services/aiService";
import { allowanceLine, canAnalyse } from "./allowanceLogic";
import { deviceTimeZone } from "./deviceTimeZone";
import { useSession } from "./useSession";

/** Today's AI allowance (003 FR-015); refreshed after every analysis (["aiAllowance"]). */
export function useAllowance() {
  const { session, status } = useSession();
  const query = useQuery({
    queryKey: ["aiAllowance", session?.user.id ?? null],
    queryFn: allowance,
    enabled: status === "ready",
  });
  const current = query.data ?? null;
  return { line: allowanceLine(current, deviceTimeZone()), canAnalyse: canAnalyse(current) };
}
