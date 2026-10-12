import { useLocalSearchParams } from "expo-router";
import FoodSearchScreen from "@/components/meals/FoodSearchScreen";

/** Yemek ara (modal). `adding=1` when opened from the review step to add another food. */
export default function LogSearch() {
  const { adding } = useLocalSearchParams<{ adding?: string }>();
  return <FoodSearchScreen adding={adding === "1"} />;
}
