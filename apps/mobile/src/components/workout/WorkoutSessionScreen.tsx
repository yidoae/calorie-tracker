import Ionicons from "@expo/vector-icons/Ionicons";
import { progressOf } from "@calorie/core/nutrition/macros";
import { router } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import FormError from "@/components/auth/FormError";
import Button from "@/components/ui/Button";
import Screen from "@/components/ui/Screen";
import StateMessage from "@/components/ui/StateMessage";
import { useWorkoutProgram, useWorkoutSessions } from "@/hooks/useWorkout";
import { useWorkoutLogger } from "@/hooks/useWorkoutLogger";
import { formatRest, sessionDraft, type SessionDraft } from "@/hooks/workoutLogic";
import { colors, radius, space, type } from "@/theme";
import CompactInput from "./CompactInput";
import IconButton from "./IconButton";

/** Logging a workout (007): one program day, its sets prefilled from last time. */
export default function WorkoutSessionScreen({ dayIndex }: { dayIndex: number }) {
  const program = useWorkoutProgram();
  const log = useWorkoutSessions();
  const back = { label: "Geri", onPress: () => router.back() };
  const day = program.data?.days[dayIndex];

  if (program.isPending || log.loading) {
    return (
      <Screen title="Antrenman" back={back}>
        <ActivityIndicator accessibilityLabel="Antrenman hazırlanıyor" color={colors.fg} style={styles.loading} />
      </Screen>
    );
  }
  if (program.error || log.loadError || !day) {
    return (
      <Screen title="Antrenman" back={back}>
        <StateMessage kind="error" title="Antrenman açılamadı" body="Bağlantını kontrol edip tekrar dene." actionLabel="Tekrar dene" onAction={() => (void program.refetch(), log.retry())} />
      </Screen>
    );
  }
  return <Logger initial={sessionDraft(day, log.sessions)} />;
}

function Logger({ initial }: { initial: SessionDraft }) {
  const w = useWorkoutLogger(initial);

  async function save() {
    if (await w.save()) router.back();
  }

  const { done, total } = w.progress;
  const hero = (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={`${done} / ${total} set yapıldı`} accessibilityValue={{ min: 0, max: total, now: done }} style={styles.hero}>
      <Text style={styles.heroNumber}>
        {done} / {total}
      </Text>
      <Text style={styles.heroCaption}>set yapıldı · ✓ ile işaretlediğin setler kaydedilir</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progressOf(done, total) * 100}%` }]} />
      </View>
    </View>
  );
  const footer = (
    <View style={styles.footer}>
      {w.restSeconds > 0 && (
        <View accessibilityLiveRegion="polite" style={styles.rest}>
          <Text style={styles.restLabel}>Dinlenme</Text>
          <Text style={styles.restTime}>{formatRest(w.restSeconds)}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Dinlenmeyi geç" onPress={w.skipRest} style={styles.skip}>
            <Text style={styles.skipLabel}>Geç</Text>
          </Pressable>
        </View>
      )}
      <Button label="Antrenmanı kaydet" loading={w.pending} onPress={() => void save()} />
    </View>
  );

  return (
    <Screen title={w.draft.dayName} back={{ label: "Geri", onPress: () => router.back() }} hero={hero} footer={footer}>
      {w.draft.exercises.map((ex, i) => (
        <View key={`${ex.name}-${i}`} style={styles.card}>
          <Text style={styles.name}>{ex.name}</Text>
          <Text style={styles.target}>Hedef: {ex.target}</Text>
          <View style={styles.row}>
            <Text style={[styles.columnLabel, styles.setNo]}>SET</Text>
            <Text style={[styles.columnLabel, styles.cell]}>KG</Text>
            <Text style={[styles.columnLabel, styles.cell]}>TEKRAR</Text>
            <View style={styles.spacer} />
            <View style={styles.spacer} />
          </View>
          {ex.sets.map((s, j) => {
            const label = `${ex.name}, ${j + 1}. set`;
            const canMark = s.done || w.canMarkDone(s);
            return (
              <View key={j} style={[styles.row, s.done && styles.rowDone]}>
                <Text style={styles.setNo}>{j + 1}</Text>
                <CompactInput label={`${label}, kilo`} value={s.kg} onChangeText={(v) => w.setField(i, j, "kg", v)} placeholder="kg" />
                <CompactInput label={`${label}, tekrar`} value={s.reps} onChangeText={(v) => w.setField(i, j, "reps", v)} placeholder="tekrar" keyboard="number" />
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityLabel={`${label} yapıldı`}
                  accessibilityState={{ checked: s.done, disabled: !canMark }}
                  disabled={!canMark}
                  onPress={() => w.toggleDone(i, j)}
                  style={[styles.check, s.done && styles.checkDone, !canMark && styles.checkDisabled]}
                >
                  <Ionicons name="checkmark" size={22} color={s.done ? colors.cta : canMark ? colors.fg : colors.fgSubtle} />
                </Pressable>
                <IconButton icon="close" label={`${label}i kaldır`} onPress={() => w.removeSet(i, j)} />
              </View>
            );
          })}
          {w.canAddSet(i) && <Button label="+ Set ekle" variant="ghost" onPress={() => w.addSet(i)} />}
        </View>
      ))}
      {w.problem && <FormError message={w.problem} />}
      {w.error && <FormError message={w.error.message} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginVertical: space(10) },
  card: { borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.lg, padding: space(4), gap: space(2) },
  name: { ...type.displayMd, color: colors.fg },
  target: { ...type.small, color: colors.fgMuted },
  row: { flexDirection: "row", alignItems: "center", gap: space(2) },
  columnLabel: { ...type.label, color: colors.fgMuted, textAlign: "center" },
  setNo: { ...type.bodyStrong, color: colors.fgMuted, width: 32, textAlign: "center" },
  cell: { flex: 1 },
  spacer: { width: 44 },
  rowDone: { backgroundColor: colors.successSoft, borderRadius: radius.md },
  check: { width: 44, height: 44, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.borderStrong, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  checkDone: { backgroundColor: colors.ink, borderColor: colors.ink },
  checkDisabled: { borderColor: colors.border },
  hero: { gap: space(1), marginTop: space(2) },
  heroNumber: { ...type.displayXl, color: colors.onInk },
  heroCaption: { ...type.small, color: colors.onInkMuted },
  track: { height: 8, marginTop: space(2), borderRadius: radius.pill, backgroundColor: colors.ink2, overflow: "hidden" },
  fill: { height: 8, borderRadius: radius.pill, backgroundColor: colors.cta },
  footer: { gap: space(3) },
  rest: { flexDirection: "row", alignItems: "center", gap: space(3), backgroundColor: colors.ink, borderRadius: radius.md, paddingLeft: space(4), paddingRight: space(1), minHeight: 52 },
  restLabel: { ...type.bodyStrong, color: colors.onInkMuted, flex: 1 },
  restTime: { ...type.displayMd, color: colors.onInk },
  skip: { minWidth: 64, height: 44, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, backgroundColor: colors.ink2 },
  skipLabel: { ...type.bodyStrong, color: colors.onInk },
});
