import { router } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import FormError from "@/components/auth/FormError";
import Field from "@/components/plan/Field";
import ChoiceCard from "@/components/setup/ChoiceCard";
import Button from "@/components/ui/Button";
import Screen from "@/components/ui/Screen";
import StateMessage from "@/components/ui/StateMessage";
import TextField from "@/components/ui/TextField";
import WeekdayPicker from "@/components/ui/WeekdayPicker";
import { useActivePlan } from "@/hooks/useActivePlan";
import { useProgramEditor } from "@/hooks/useProgramEditor";
import { useWeeklyPlan } from "@/hooks/useWeeklyPlan";
import { useWorkoutProgram } from "@/hooks/useWorkout";
import { programDraft, TEMPLATES, type ProgramDraft } from "@/hooks/workoutLogic";
import { colors, radius, space, type } from "@/theme";
import CompactInput from "./CompactInput";
import IconButton from "./IconButton";

/**
 * Program editor (007): the saved program, or for a first program the split chosen in the plan
 * wizard (Push / Pull / Legs when none), ready to change.
 */
export default function ProgramEditorScreen() {
  const program = useWorkoutProgram();
  const plan = useActivePlan();
  const back = { label: "Geri", onPress: () => router.back() };

  if (program.isPending || (!program.data && plan.isPending)) {
    return (
      <Screen title="Program" back={back}>
        <ActivityIndicator accessibilityLabel="Programın yükleniyor" color={colors.fg} style={styles.loading} />
      </Screen>
    );
  }
  if (program.error) {
    return (
      <Screen title="Program" back={back}>
        <StateMessage kind="error" title="Programın yüklenemedi" body="Bağlantını kontrol edip tekrar dene." actionLabel="Tekrar dene" onAction={() => void program.refetch()} />
      </Screen>
    );
  }
  const fromPlan = TEMPLATES.find((t) => t.id === plan.data?.inputs.split) ?? TEMPLATES[0];
  return <Editor initial={programDraft(program.data ?? fromPlan.program)} isNew={!program.data} />;
}

function Editor({ initial, isNew }: { initial: ProgramDraft; isNew: boolean }) {
  const e = useProgramEditor(initial);
  const weekly = useWeeklyPlan();

  async function save() {
    const saved = await e.save();
    if (!saved) return;
    // This week and (from Sunday 18:00) next week follow the new program; it finishes after leaving.
    void weekly.replan(saved);
    router.back();
  }

  return (
    <Screen
      title={isNew ? "Program oluştur" : "Programı düzenle"}
      lead="Günleri, hareketleri, set, tekrar ve kiloları yaz."
      back={{ label: "Geri", onPress: () => router.back() }}
      footer={<Button label="Programı kaydet" loading={e.pending} onPress={() => void save()} />}
    >
      <Field label="Hazır programdan başla" hint="Seçtiğin program aşağıdakilerin yerine geçer; kaydetmeden çıkarsan hiçbir şey değişmez." radiogroup>
        {TEMPLATES.map((t) => (
          <ChoiceCard key={t.id} title={t.label} hint={t.hint} selected={e.template === t.id} onPress={() => e.applyTemplate(t.id)} />
        ))}
      </Field>

      <TextField label="Program adı" value={e.draft.name} onChangeText={e.setName} maxLength={60} />
      <TextField label="Program tipi" value={e.draft.split} onChangeText={e.setSplit} hint="Örn. Push / Pull / Legs, Upper / Lower, Full body" maxLength={40} />
      <Field
        label="Hangi günler antrenman yapıyorsun?"
        hint={e.draft.weekdays.length === 0 ? "Gün seçmezsen haftalık plan antrenmanları haftaya yayar." : `${e.draft.weekdays.length} gün · haftalık plan bu günlere kurulur.`}
      >
        <WeekdayPicker value={e.draft.weekdays} onToggle={e.toggleWeekday} />
      </Field>

      {e.draft.days.map((day, d) => (
        <View key={d} style={styles.day}>
          <View style={styles.dayHead}>
            <View style={styles.grow}>
              <TextField label={`${d + 1}. gün`} value={day.name} onChangeText={(v) => e.setDayName(d, v)} maxLength={40} />
            </View>
            {e.draft.days.length > 1 && <IconButton icon="trash-outline" label={`${day.name} gününü kaldır`} onPress={() => e.removeDay(d)} />}
          </View>

          {day.exercises.map((ex, i) => (
            <View key={i} style={styles.exercise}>
              <View style={styles.row}>
                <CompactInput label={`${d + 1}. gün, ${i + 1}. hareket adı`} value={ex.name} onChangeText={(v) => e.setExercise(d, i, "name", v)} placeholder="Hareket adı" keyboard="text" />
                <IconButton icon="close" label={`${ex.name || `${i + 1}. hareket`} kaldır`} onPress={() => e.removeExercise(d, i)} />
              </View>
              <View style={styles.row}>
                <View style={styles.cell}>
                  <Text style={styles.columnLabel}>SET</Text>
                  <CompactInput label={`${ex.name} set sayısı`} value={ex.sets} onChangeText={(v) => e.setExercise(d, i, "sets", v)} keyboard="number" />
                </View>
                <View style={styles.cell}>
                  <Text style={styles.columnLabel}>TEKRAR</Text>
                  <CompactInput label={`${ex.name} tekrar`} value={ex.reps} onChangeText={(v) => e.setExercise(d, i, "reps", v)} placeholder="8-12" keyboard="text" />
                </View>
                <View style={styles.cell}>
                  <Text style={styles.columnLabel}>KG</Text>
                  <CompactInput label={`${ex.name} hedef kilo`} value={ex.kg} onChangeText={(v) => e.setExercise(d, i, "kg", v)} placeholder="—" />
                </View>
                <View style={styles.spacer} />
              </View>
            </View>
          ))}
          {e.canAddExercise(d) && <Button label="+ Hareket ekle" variant="ghost" onPress={() => e.addExercise(d)} />}
        </View>
      ))}
      {e.canAddDay && <Button label="+ Gün ekle" variant="secondary" onPress={e.addDay} />}

      {e.problem && <FormError message={e.problem} />}
      {e.error && <FormError message={e.error.message} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginVertical: space(10) },
  day: { borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.lg, padding: space(4), gap: space(3) },
  dayHead: { flexDirection: "row", alignItems: "flex-end", gap: space(1) },
  grow: { flex: 1 },
  columnLabel: { ...type.label, color: colors.fgMuted },
  exercise: { gap: space(2), paddingBottom: space(3), borderBottomWidth: 1, borderBottomColor: colors.border },
  row: { flexDirection: "row", alignItems: "flex-end", gap: space(2) },
  cell: { flex: 1, gap: space(1) },
  // Lines the number cells up under the name field, whose row ends in a 44 pt button.
  spacer: { width: 44 },
});
