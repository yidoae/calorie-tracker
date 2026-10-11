import { useLocalSearchParams } from "expo-router";
import MealDetailScreen from "@/components/meals/MealDetailScreen";

/** Öğün: one of the user's meals (RLS hides anyone else's). */
export default function Meal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <MealDetailScreen key={id} mealId={id} />;
}
