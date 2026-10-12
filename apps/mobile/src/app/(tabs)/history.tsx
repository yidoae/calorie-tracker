import { router } from "expo-router";
import { ActivityIndicator, StyleSheet } from "react-native";
import MonthCalendar from "@/components/history/MonthCalendar";
import Screen from "@/components/ui/Screen";
import StateMessage from "@/components/ui/StateMessage";
import { useMonthCalendar } from "@/hooks/useMonthCalendar";
import { colors, space } from "@/theme";

/** Geçmiş (US5, FR-019): a month calendar with on-target marks; a day opens its meals and totals. */
export default function History() {
  const cal = useMonthCalendar();

  return (
    <Screen title="Geçmiş" lead="Hangi gün hedefindeydin?">
      <MonthCalendar
        title={cal.title}
        days={cal.days}
        canGoForward={cal.canGoForward}
        onBack={cal.back}
        onForward={cal.forward}
        onOpen={(date) => router.push({ pathname: "/day/[date]", params: { date } })}
      />
      {cal.loading ? (
        <ActivityIndicator accessibilityLabel="Ay yükleniyor" color={colors.fg} style={styles.loading} />
      ) : cal.error ? (
        <StateMessage kind="error" title="Takvim yüklenemedi" body={cal.error.message} actionLabel="Tekrar dene" onAction={cal.retry} />
      ) : (
        !cal.hasMeals && <StateMessage kind="empty" title="Bu ay kayıt yok" body="Öğün kaydettiğin günler burada işaretlenir." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginVertical: space(6) },
});
