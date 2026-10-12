import { router } from "expo-router";
import DayBody from "@/components/dashboard/DayBody";
import Button from "@/components/ui/Button";
import Screen from "@/components/ui/Screen";
import { useDashboard } from "@/hooks/useDashboard";

/**
 * Bugün (US3, FR-018): today's calorie ring and macro bars from the meals against the active plan,
 * the meals under their slots and the add button. Saving, editing or deleting a meal refreshes it.
 */
export default function Today() {
  const day = useDashboard();
  const footer = <Button testID="today-add-meal" label="Öğün ekle" onPress={() => router.push("/log/search")} />;

  return (
    <Screen title="Bugün" lead="Günlük hedeflerin ve öğünlerin." footer={footer}>
      <DayBody day={day} subject="Günün" empty={{ title: "Henüz öğün yok", body: "Yediklerini “Öğün ekle” ile kaydet; halka ve çubuklar dolsun." }} />
    </Screen>
  );
}
