import { searchQuery } from "@calorie/core/search/normalize";
import { parseMeal } from "@calorie/core/text/parseMeal";
import { PORTION_UNITS } from "@calorie/core/text/units";
import { useQueries } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { search } from "@/services/foodService";
import { previewLine, proposedFoods, type PreviewLine } from "./textPreviewLogic";

const DEBOUNCE_MS = 300;

/**
 * The live preview under the meal description (003 FR-007, FR-008): the text is parsed on the
 * device, then each phrase goes through the same food search as typing a search (same cache).
 * No model and no allowance. While a phrase is still searching it shows without a food.
 */
export function useTextPreview(text: string) {
  const [debounced, setDebounced] = useState(text);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(text), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text]);

  const phrases = parseMeal(debounced, PORTION_UNITS);
  const queries = useQueries({
    queries: phrases.map((p) => {
      const q = searchQuery(p.query);
      return { queryKey: ["foodSearch", q], queryFn: () => search(q), enabled: q.length >= 2, staleTime: 5 * 60_000 };
    }),
  });

  const lines: PreviewLine[] = phrases.map((p, i) => previewLine(p, queries[i]?.data ?? []));
  return {
    lines,
    searching: queries.some((q) => q.isFetching),
    offline: queries.some((q) => q.isError),
    proposed: proposedFoods(lines),
  };
}
