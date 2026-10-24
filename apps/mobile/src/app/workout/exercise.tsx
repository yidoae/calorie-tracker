import { useLocalSearchParams } from "expo-router";
import ExerciseProgressScreen from "@/components/workout/ExerciseProgressScreen";

/** One exercise's weight progress (`name`) (007). */
export default function WorkoutExercise() {
  const { name } = useLocalSearchParams<{ name?: string }>();
  return <ExerciseProgressScreen name={name ?? ""} />;
}
