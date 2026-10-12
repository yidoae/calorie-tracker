import { router } from "expo-router";
import { ActivityIndicator, StyleSheet } from "react-native";
import DaySummary from "@/components/dashboard/DaySummary";
import SlotMeals from "@/components/dashboard/SlotMeals";
import Screen from "@/components/ui/Screen";
import StateMessage from "@/components/ui/StateMessage";
import { usePastDay } from "@/hooks/usePastDay";
import { colors, space } from "@/theme";

/** A day from the calendar (US5): the dashboard's ring, bars and meals, against that day's targets. */
export default function DayDetailScreen({ date }: { date: string | undefined }) {
  const day = usePastDay(date);
  const back = { label: "Takvime dön", onPress: () => router.back() };

  if (!day.valid) {
    return (
      <Screen title="Gün" back={back}>
        <StateMessage kind="error" title="Bu gün açılamıyor" body="Takvimden bugünü ya da geçmiş bir günü seç." />
      </Screen>
    );
  }

  return (
    <Screen title={day.title} lead="O günün hedefleri ve öğünleri." back={back}>
      {day.loading ? (
        <ActivityIndicator accessibilityLabel="Gün yükleniyor" color={colors.fg} style={styles.loading} />
      ) : day.error || !day.resolved ? (
        <StateMessage kind="error" title="Gün yüklenemedi" body={day.error?.message} actionLabel="Tekrar dene" onAction={day.retry} />
      ) : (
        <>
          <DaySummary eaten={day.eaten} targets={day.resolved.targets} dayType={day.resolved.dayType} />
          {day.groups.length === 0 ? (
            <StateMessage kind="empty" title="Bu gün öğün yok" body="O gün kayıt girilmemiş." />
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
