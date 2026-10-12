import { useLocalSearchParams } from "expo-router";
import PlanReviewScreen from "@/components/plan/PlanReviewScreen";

/** İnce ayar: the wizard's new plan (`source=wizard`) or the active plan, tuned and saved (US4). */
export default function PlanReview() {
  const { source } = useLocalSearchParams<{ source?: string }>();
  return <PlanReviewScreen fromWizard={source === "wizard"} />;
}
