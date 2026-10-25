import { useLocalSearchParams } from "expo-router";
import FoodSearchScreen from "@/components/meals/FoodSearchScreen";
import { slotParam } from "@/hooks/mealLogic";

/**
 * Yemek ara (modal). `adding=1` when opened from the review step to add another food; `resolve`
 * and `q` when it replaces an unmatched AI entry (003); `slot` when a slot's "+" on Bugün opened it.
 */
export default function LogSearch() {
  const { adding, resolve, q, slot } = useLocalSearchParams<{ adding?: string; resolve?: string; q?: string; slot?: string }>();
  return <FoodSearchScreen adding={adding === "1"} resolve={resolve} initialText={q} slot={slotParam(slot)} />;
}
