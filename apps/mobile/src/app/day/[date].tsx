import { useLocalSearchParams } from "expo-router";
import DayDetailScreen from "@/components/history/DayDetailScreen";

/** A past day: its meals and totals against that day's targets (US5, FR-019). */
export default function Day() {
  const { date } = useLocalSearchParams<{ date: string }>();
  return <DayDetailScreen key={date} date={date} />;
}
