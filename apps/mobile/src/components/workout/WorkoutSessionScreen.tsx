import { router } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import FormError from "@/components/auth/FormError";
import Button from "@/components/ui/Button";
import Screen from "@/components/ui/Screen";
import StateMessage from "@/components/ui/StateMessage";
import { useWorkoutProgram, useWorkoutSessions } from "@/hooks/useWorkout";
import { useWorkoutLogger } from "@/hooks/useWorkoutLogger";
import { sessionDraft, type SessionDraft } from "@/hooks/workoutLogic";
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

  return (
    <Screen
      title={w.draft.dayName}
      lead="Kilolar son antrenmanından geliyor; yaptığını yaz. Boş bıraktığın hareket kaydedilmez."
      back={{ label: "Geri", onPress: () => router.back() }}
      footer={<Button label="Antrenmanı kaydet" loading={w.pending} onPress={() => void save()} />}
    >
      {w.draft.exercises.map((ex, i) => (
        <View key={`${ex.name}-${i}`} style={styles.card}>
          <Text style={styles.name}>{ex.name}</Text>
          <Text style={styles.target}>Hedef: {ex.target}</Text>
          <View style={styles.row}>
            <Text style={[styles.columnLabel, styles.setNo]}>SET</Text>
            <Text style={[styles.columnLabel, styles.cell]}>KG</Text>
            <Text style={[styles.columnLabel, styles.cell]}>TEKRAR</Text>
            <View style={styles.spacer} />
          </View>
          {ex.sets.map((s, j) => (
            <View key={j} style={styles.row}>
              <Text style={styles.setNo}>{j + 1}</Text>
              <CompactInput label={`${ex.name}, ${j + 1}. set, kilo`} value={s.kg} onChangeText={(v) => w.setField(i, j, "kg", v)} placeholder="kg" />
              <CompactInput label={`${ex.name}, ${j + 1}. set, tekrar`} value={s.reps} onChangeText={(v) => w.setField(i, j, "reps", v)} placeholder="tekrar" keyboard="number" />
              <IconButton icon="close" label={`${ex.name}, ${j + 1}. seti kaldır`} onPress={() => w.removeSet(i, j)} />
            </View>
          ))}
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
});
