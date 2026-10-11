import { router } from "expo-router";
import { ActivityIndicator, StyleSheet } from "react-native";
import DaySummary from "@/components/dashboard/DaySummary";
import SlotMeals from "@/components/dashboard/SlotMeals";
import Button from "@/components/ui/Button";
import Screen from "@/components/ui/Screen";
import StateMessage from "@/components/ui/StateMessage";
import { useDashboard } from "@/hooks/useDashboard";
import { colors, space } from "@/theme";

/**
 * Bugün (US3, FR-018): today's calorie ring and macro bars from the meals against the active plan,
 * the meals under their slots and the add button. Saving, editing or deleting a meal refreshes it.
 */
export default function Today() {
  const day = useDashboard();
  const footer = <Button label="Öğün ekle" onPress={() => router.push("/log/search")} />;

  return (
    <Screen title="Bugün" lead="Günlük hedeflerin ve öğünlerin." footer={footer}>
      {day.loading ? (
        <ActivityIndicator accessibilityLabel="Günün yükleniyor" color={colors.fg} style={styles.loading} />
      ) : day.error || !day.resolved ? (
        <StateMessage kind="error" title="Günün yüklenemedi" body={day.error?.message} actionLabel="Tekrar dene" onAction={day.retry} />
      ) : (
        <>
          <DaySummary eaten={day.eaten} targets={day.resolved.targets} dayType={day.resolved.dayType} />
          {day.groups.length === 0 ? (
            <StateMessage kind="empty" title="Henüz öğün yok" body="Yediklerini “Öğün ekle” ile kaydet; halka ve çubuklar dolsun." />
          ) : (
            day.groups.map((group) => (
              <SlotMeals key={group.slot} group={group} onOpen={(id) => router.push({ pathname: "/meal/[id]", params: { id } })} />
            ))
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginVertical: space(10) },
});
