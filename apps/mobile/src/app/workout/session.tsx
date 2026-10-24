import { useLocalSearchParams } from "expo-router";
import WorkoutSessionScreen from "@/components/workout/WorkoutSessionScreen";

/** Logging a workout for one program day (`day` = its index) (007). */
export default function WorkoutSession() {
  const { day } = useLocalSearchParams<{ day?: string }>();
  return <WorkoutSessionScreen dayIndex={Number(day ?? 0)} />;
}
