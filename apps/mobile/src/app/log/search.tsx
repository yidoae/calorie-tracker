import { useLocalSearchParams } from "expo-router";
import FoodSearchScreen from "@/components/meals/FoodSearchScreen";

/**
 * Yemek ara (modal). `adding=1` when opened from the review step to add another food; `resolve`
 * and `q` when it replaces an unmatched AI entry (003).
 */
export default function LogSearch() {
  const { adding, resolve, q } = useLocalSearchParams<{ adding?: string; resolve?: string; q?: string }>();
  return <FoodSearchScreen adding={adding === "1"} resolve={resolve} initialText={q} />;
}
