import { useLocalSearchParams } from "expo-router";
import WorkoutSessionScreen from "@/components/workout/WorkoutSessionScreen";

/** Logging a workout: a weekly-plan day (`date`, 008) or a program day (`day` = its index, 007). */
export default function WorkoutSession() {
  const { day, date } = useLocalSearchParams<{ day?: string; date?: string }>();
  return <WorkoutSessionScreen dayIndex={Number(day ?? 0)} plannedDate={date} />;
}
