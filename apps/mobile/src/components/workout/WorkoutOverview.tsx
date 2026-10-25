import Ionicons from "@expo/vector-icons/Ionicons";
import { dayToDate, LOCALE } from "@calorie/core/dates";
import type { WorkoutSession } from "@calorie/core/schemas/workout";
import { router } from "expo-router";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import FormError from "@/components/auth/FormError";
import Button from "@/components/ui/Button";
import Screen from "@/components/ui/Screen";
import StateMessage from "@/components/ui/StateMessage";
import { useWeeklyPlan } from "@/hooks/useWeeklyPlan";
import { useWorkoutProgram, useWorkoutSessions } from "@/hooks/useWorkout";
import { formatKg } from "@/hooks/workoutLogic";
import { colors, radius, space, type } from "@/theme";
import IconButton from "./IconButton";
import WeekPlanCard from "./WeekPlanCard";

const RECENT = 10;
const dateLabel = (day: string) => dayToDate(day).toLocaleDateString(LOCALE, { day: "numeric", month: "short", weekday: "short" });

/** Antrenman (007): the program's days to start, each exercise's best weight, and the latest workouts. */
export default function WorkoutOverview() {
  const program = useWorkoutProgram();
  const log = useWorkoutSessions();
  const weekly = useWeeklyPlan();
  const doneDates = new Set(log.sessions.map((s) => s.performedOn));

  const footer = (
    <Button
      label={program.data ? "Programı düzenle" : "Program oluştur"}
      variant={program.data ? "secondary" : "primary"}
      onPress={() => router.push("/workout/program")}
    />
  );

  function confirmRemove(s: WorkoutSession) {
    Alert.alert("Antrenman silinsin mi?", `${dateLabel(s.performedOn)} · ${s.dayName}`, [
      { text: "Vazgeç", style: "cancel" },
      { text: "Sil", style: "destructive", onPress: () => void log.remove(s.id) },
    ]);
  }

  return (
    <Screen title="Antrenman" lead="Programın, setlerin ve kilo gelişimin." footer={program.isPending || program.error ? undefined : footer}>
      {program.isPending ? (
        <ActivityIndicator accessibilityLabel="Programın yükleniyor" color={colors.fg} style={styles.loading} />
      ) : program.error ? (
        <StateMessage kind="error" title="Programın yüklenemedi" body="Bağlantını kontrol edip tekrar dene." actionLabel="Tekrar dene" onAction={() => void program.refetch()} />
      ) : !program.data ? (
        <StateMessage kind="empty" title="Henüz programın yok" body="Push / Pull / Legs, Upper / Lower ya da kendi programını kur; hareketleri ve kiloları sen yaz." />
      ) : (
        <>
          {weekly.nextWeek && <WeekPlanCard title="GELECEK HAFTA" week={weekly.nextWeek} doneDates={doneDates} today={weekly.today} />}
          {weekly.thisWeek ? (
            <WeekPlanCard title="BU HAFTA" week={weekly.thisWeek} doneDates={doneDates} today={weekly.today} />
          ) : weekly.loading ? (
            <ActivityIndicator accessibilityLabel="Haftalık plan hazırlanıyor" color={colors.fg} />
          ) : weekly.error ? (
            <StateMessage kind="error" title="Haftalık plan hazırlanamadı" actionLabel="Tekrar dene" onAction={() => void weekly.replan()} />
          ) : null}
          <View style={styles.card}>
            <Text style={styles.eyebrow}>{program.data.split.toLocaleUpperCase(LOCALE)}</Text>
            <Text style={styles.cardTitle}>{program.data.name}</Text>
            {program.data.days.map((day, i) => (
              <Pressable
                key={`${day.name}-${i}`}
                accessibilityRole="button"
                accessibilityLabel={`${day.name} antrenmanını başlat, ${day.exercises.length} hareket`}
                disabled={day.exercises.length === 0}
                onPress={() => router.push({ pathname: "/workout/session", params: { day: String(i) } })}
                style={({ pressed }) => [styles.dayRow, pressed && styles.pressed]}
              >
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{day.name}</Text>
                  <Text style={styles.rowHint}>{day.exercises.length === 0 ? "Hareket yok, programı düzenle" : day.exercises.map((e) => e.name).join(", ")}</Text>
                </View>
                {day.exercises.length > 0 && (
                  <View style={styles.start}>
                    <Text style={styles.startLabel}>Başla</Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.fg} />
                  </View>
                )}
              </Pressable>
            ))}
          </View>

          <Text style={styles.section}>KİLO GELİŞİMİ</Text>
          {log.loading ? (
            <ActivityIndicator accessibilityLabel="Antrenmanların yükleniyor" color={colors.fg} />
          ) : log.loadError ? (
            <StateMessage kind="error" title="Antrenmanların yüklenemedi" actionLabel="Tekrar dene" onAction={log.retry} />
          ) : log.progress.length === 0 ? (
            <Text style={styles.empty}>İlk antrenmanını kaydettiğinde her hareketin en iyi kilosu burada görünür.</Text>
          ) : (
            <View style={styles.list}>
              {log.progress.map((p) => {
                const last = p.entries.at(-1)!;
                return (
                  <Pressable
                    key={p.name}
                    accessibilityRole="button"
                    accessibilityLabel={`${p.name}: en iyi ${formatKg(p.bestKg)} kilo, gelişimi gör`}
                    onPress={() => router.push({ pathname: "/workout/exercise", params: { name: p.name } })}
                    style={({ pressed }) => [styles.listRow, pressed && styles.pressed]}
                  >
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle}>{p.name}</Text>
                      <Text style={styles.rowHint}>
                        Son: {formatKg(last.topKg)} kg × {last.topReps} · {p.entries.length} antrenman
                      </Text>
                    </View>
                    <Text style={styles.best}>{formatKg(p.bestKg)} kg</Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.fgMuted} />
                  </Pressable>
                );
              })}
            </View>
          )}

          {log.sessions.length > 0 && (
            <>
              <Text style={styles.section}>SON ANTRENMANLAR</Text>
              {log.removeError && <FormError message={log.removeError.message} />}
              <View style={styles.list}>
                {log.sessions.slice(0, RECENT).map((s) => (
                  <View key={s.id} style={styles.listRow}>
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle}>
                        {s.dayName} · {dateLabel(s.performedOn)}
                      </Text>
                      <Text style={styles.rowHint}>
                        {s.exercises.length} hareket · {s.exercises.reduce((n, e) => n + e.sets.length, 0)} set
                      </Text>
                    </View>
                    <IconButton icon="trash-outline" label={`${s.dayName} antrenmanını sil`} onPress={() => confirmRemove(s)} />
                  </View>
                ))}
              </View>
            </>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginVertical: space(10) },
  card: { borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.lg, padding: space(4), gap: space(1) },
  eyebrow: { ...type.label, color: colors.fgMuted },
  cardTitle: { ...type.displayMd, color: colors.fg, marginBottom: space(2) },
  dayRow: { flexDirection: "row", alignItems: "center", gap: space(3), minHeight: 56, paddingVertical: space(2), borderTopWidth: 1, borderTopColor: colors.border },
  pressed: { backgroundColor: colors.surface2 },
  rowText: { flex: 1, gap: space(0.5) },
  rowTitle: { ...type.bodyStrong, color: colors.fg },
  rowHint: { ...type.small, color: colors.fgMuted },
  start: { flexDirection: "row", alignItems: "center", gap: space(1) },
  startLabel: { ...type.bodyStrong, color: colors.fg },
  section: { ...type.label, color: colors.fgMuted, marginTop: space(2) },
  empty: { ...type.body, color: colors.fgMuted },
  list: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: space(4) },
  listRow: { flexDirection: "row", alignItems: "center", gap: space(2), minHeight: 56, paddingVertical: space(2), borderBottomWidth: 1, borderBottomColor: colors.border },
  best: { ...type.displayMd, color: colors.fg },
});
