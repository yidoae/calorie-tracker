import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { AiError, analyse, newRequestKey, type AiInput } from "@/services/aiService";
import { toAppError, type AppError } from "@/services/errors";
import { byIds } from "@/services/foodService";
import { useMealDraft } from "./useMealDraft";

/**
 * One AI analysis, photo or text (003 FR-004, FR-009): sends it, loads the proposed foods, fills
 * the meal draft and opens the review step. A retry reuses the request key, so the server counts
 * it once (FR-014); cancelling ignores a late answer.
 */
export function useAiLog() {
  const { fillFromAi } = useMealDraft();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const attempt = useRef<{ key: string; input: AiInput } | null>(null);
  const live = useRef(0);

  async function send(key: string, input: AiInput) {
    const run = ++live.current;
    attempt.current = { key, input };
    setPending(true);
    setError(null);
    try {
      const result = await analyse(input, key);
      const foods = await byIds(result.items.map((i) => i.foodId));
      if (run !== live.current) return;
      const byId = new Map(foods.map((f) => [f.foodId, f]));
      const proposed = result.items.flatMap((i) => {
        const food = byId.get(i.foodId);
        return food ? [{ food, grams: i.grams, estimated: i.estimated }] : [];
      });
      const missing = result.items.filter((i) => !byId.has(i.foodId)).map((i) => ({ description: i.foodId, grams: i.grams }));
      fillFromAi(proposed, [...result.unmatched, ...missing]);
      attempt.current = null;
      router.replace("/log/review");
    } catch (e) {
      if (run === live.current) setError(e instanceof AiError ? e : toAppError(e));
    } finally {
      if (run === live.current) setPending(false);
      void queryClient.invalidateQueries({ queryKey: ["aiAllowance"] });
    }
  }

  return {
    analyse: (input: AiInput) => void send(newRequestKey(), input),
    /** The same attempt again (same key): never counted twice. */
    retry: () => attempt.current && void send(attempt.current.key, attempt.current.input),
    cancel: () => {
      live.current++;
      setPending(false);
    },
    pending,
    error,
    resetsAt: error instanceof AiError ? error.resetsAt : null,
  };
}
