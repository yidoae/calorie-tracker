import { searchQuery } from "@calorie/core/search/normalize";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toAppError, type AppError } from "@/services/errors";
import { search, type FoodHit } from "@/services/foodService";

const DEBOUNCE_MS = 250;
/** Shorter queries match too much to be useful. */
const MIN_QUERY = 2;

interface FoodSearchState {
  hits: FoodHit[];
  /** Nothing to search for yet (fewer than two letters typed). */
  idle: boolean;
  searching: boolean;
  error: AppError | null;
  retry: () => void;
}

/**
 * Results while the user types (FR-012): the text is debounced, then sent with its Turkish suffix
 * candidates ("tavuğu" → "tavuğu tavuk", core searchQuery). Earlier results stay on screen while
 * the next ones load.
 */
export function useFoodSearch(text: string): FoodSearchState {
  const [debounced, setDebounced] = useState(text);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(text), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text]);

  const q = searchQuery(debounced);
  const idle = q.length < MIN_QUERY;
  const query = useQuery({
    queryKey: ["foodSearch", q],
    queryFn: () => search(q),
    enabled: !idle,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  });

  return {
    hits: idle ? [] : (query.data ?? []),
    idle,
    searching: !idle && query.isFetching,
    error: !idle && query.error ? toAppError(query.error) : null,
    retry: () => void query.refetch(),
  };
}
