import { dayToDate, LOCALE } from "@calorie/core/dates";
import { normalizeTr } from "@calorie/core/search/normalize";
import { router } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Screen from "@/components/ui/Screen";
import StateMessage from "@/components/ui/StateMessage";
import { useWorkoutSessions } from "@/hooks/useWorkout";
import { formatKg } from "@/hooks/workoutLogic";
import { colors, radius, space, type } from "@/theme";
import ProgressChart from "./ProgressChart";

const dateLabel = (day: string) => dayToDate(day).toLocaleDateString(LOCALE, { day: "numeric", month: "long" });

/** One exercise's weight progress (007): best lift, estimated 1RM, the chart and every workout. */
export default function ExerciseProgressScreen({ name }: { name: string }) {
  const log = useWorkoutSessions();
  const back = { label: "Geri", onPress: () => router.back() };
  const p = log.progress.find((x) => normalizeTr(x.name) === normalizeTr(name));

  return (
    <Screen title={p?.name ?? name} lead="Her antrenmandaki en ağır setin." back={back}>
      {log.loading ? (
        <ActivityIndicator accessibilityLabel="Gelişimin yükleniyor" color={colors.fg} style={styles.loading} />
      ) : log.loadError ? (
        <StateMessage kind="error" title="Gelişimin yüklenemedi" actionLabel="Tekrar dene" onAction={log.retry} />
      ) : !p ? (
        <StateMessage kind="empty" title="Bu hareket için kayıt yok" body="Bir antrenmanda kaydettiğinde burada görünür." />
      ) : (
        <>
          <View style={styles.tiles}>
            <Tile label="EN İYİ" value={`${formatKg(p.bestKg)} kg`} />
            <Tile label="TAHMİNİ 1RM" value={`${formatKg(p.bestE1rm)} kg`} />
            <Tile label="ANTRENMAN" value={String(p.entries.length)} />
          </View>
          <ProgressChart entries={p.entries} />
          <View style={styles.list}>
            {[...p.entries].reverse().map((e, i) => (
              <View key={i} style={styles.row}>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{dateLabel(e.date)}</Text>
                  <Text style={styles.rowHint}>Hacim {formatKg(e.volume)} kg · 1RM ~{formatKg(e.e1rm)} kg</Text>
                </View>
                <Text style={styles.top}>
                  {formatKg(e.topKg)} kg × {e.topReps}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { marginVertical: space(10) },
  tiles: { flexDirection: "row", gap: space(2) },
  tile: { flex: 1, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.md, padding: space(3), gap: space(1) },
  tileLabel: { ...type.label, color: colors.fgMuted },
  tileValue: { ...type.displayMd, color: colors.fg },
  list: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: space(4) },
  row: { flexDirection: "row", alignItems: "center", gap: space(2), minHeight: 56, paddingVertical: space(2), borderBottomWidth: 1, borderBottomColor: colors.border },
  rowText: { flex: 1, gap: space(0.5) },
  rowTitle: { ...type.bodyStrong, color: colors.fg },
  rowHint: { ...type.small, color: colors.fgMuted },
  top: { ...type.bodyStrong, color: colors.fg },
});
