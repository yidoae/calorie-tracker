import Ionicons from "@expo/vector-icons/Ionicons";
import { dayToDate, LOCALE } from "@calorie/core/dates";
import { WEEKDAY_SHORT } from "@calorie/core/labels";
import type { PlannedExercise, TargetChange, WeekFeedback, WeekIntensity, WeekPlan } from "@calorie/core/schemas/workout";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CHANGE_LABELS, dayStatus, targetText } from "@/hooks/workoutLogic";
import { colors, radius, space, type } from "@/theme";

const INTENSITY: Record<WeekIntensity, { badge: string; hint: string; bg: string; fg: string }> = {
  normal: { badge: "Normal hafta", hint: "Hedefler son antrenmanlarına göre ilerliyor.", bg: colors.successSoft, fg: colors.successText },
  light: { badge: "Hafif hafta", hint: "Geçen hafta eksik kaldı; kilolar sabit.", bg: colors.carbsSoft, fg: colors.fg },
  deload: { badge: "Deload", hint: "Yük yaklaşık %10 az, bir set eksik: toparlanma haftası.", bg: colors.warningSoft, fg: colors.warningText },
};
const CHIP: Record<Exclude<TargetChange, "new">, { bg: string; fg: string }> = {
  up_kg: { bg: colors.successSoft, fg: colors.successText },
  up_reps: { bg: colors.proteinSoft, fg: colors.fg },
  hold: { bg: colors.surface3, fg: colors.fgMuted },
  deload: { bg: colors.warningSoft, fg: colors.warningText },
};
const STATUS = { done: "Yapıldı", today: "Bugün", missed: "Kaçırıldı", upcoming: "" } as const;

const shortDate = (day: string) => dayToDate(day).toLocaleDateString(LOCALE, { day: "numeric", month: "short" });
const weekday = (day: string) => WEEKDAY_SHORT[(dayToDate(day).getDay() + 6) % 7];
function weekRange(weekStart: string): string {
  const end = dayToDate(weekStart);
  end.setDate(end.getDate() + 6);
  return `${shortDate(weekStart)} – ${end.toLocaleDateString(LOCALE, { day: "numeric", month: "short" })}`;
}

interface Props {
  title: string;
  week: WeekPlan;
  doneDates: ReadonlySet<string>;
  today: string;
}

/**
 * A week of the training plan (008): its intensity, the feedback on the week before and each planned
 * day with its targets and why they moved; a day opens the logger with its targets. Today is lime,
 * a day with a logged workout gets a tick.
 */
export default function WeekPlanCard({ title, week, doneDates, today }: Props) {
  const intensity = INTENSITY[week.intensity];
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={styles.eyebrow}>{title}</Text>
          <Text style={styles.range}>{weekRange(week.weekStart)}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: intensity.bg }]}>
          <Text style={[styles.badgeLabel, { color: intensity.fg }]}>{intensity.badge}</Text>
        </View>
      </View>
      <Text style={styles.hint}>{intensity.hint}</Text>
      {week.feedback && <Feedback feedback={week.feedback} />}
      {week.days.length === 0 ? (
        <Text style={styles.empty}>Bu hafta için planlı antrenman yok. Programına gün ve hareket ekle.</Text>
      ) : (
        week.days.map((day) => {
          const status = dayStatus(day.date, today, doneDates);
          return (
            <Pressable
              key={day.date}
              accessibilityRole="button"
              accessibilityLabel={`${weekday(day.date)} ${shortDate(day.date)}, ${day.name}${STATUS[status] ? `, ${STATUS[status]}` : ""}, antrenmanı aç`}
              onPress={() => router.push({ pathname: "/workout/session", params: { date: day.date } })}
              style={({ pressed }) => [styles.day, status === "today" && styles.dayToday, pressed && styles.pressed]}
            >
              <View style={[styles.date, status === "today" && styles.dateToday, status === "done" && styles.dateDone]}>
                {status === "done" ? (
                  <Ionicons name="checkmark" size={22} color={colors.cta} />
                ) : (
                  <>
                    <Text style={[styles.dateDay, status === "missed" && styles.muted]}>{weekday(day.date)}</Text>
                    <Text style={[styles.dateNum, status === "missed" && styles.muted]}>{dayToDate(day.date).getDate()}</Text>
                  </>
                )}
              </View>
              <View style={styles.dayText}>
                <View style={styles.dayTitleRow}>
                  <Text style={styles.dayName}>{day.name}</Text>
                  {STATUS[status] !== "" && <Text style={[styles.status, status === "missed" && styles.muted]}>{STATUS[status]}</Text>}
                </View>
                {day.exercises.map((e, i) => (
                  <ExerciseLine key={`${e.name}-${i}`} exercise={e} />
                ))}
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.fgMuted} />
            </Pressable>
          );
        })
      )}
    </View>
  );
}

function ExerciseLine({ exercise }: { exercise: PlannedExercise }) {
  const label = CHANGE_LABELS[exercise.change];
  const chip = exercise.change === "new" ? null : CHIP[exercise.change];
  return (
    <View style={styles.exercise}>
      <Text style={styles.exerciseText}>
        <Text style={styles.exerciseName}>{exercise.name}</Text> {targetText(exercise)}
      </Text>
      {label && chip && (
        <View style={[styles.chip, { backgroundColor: chip.bg }]}>
          <Text style={[styles.chipLabel, { color: chip.fg }]}>{label}</Text>
        </View>
      )}
    </View>
  );
}

function Feedback({ feedback }: { feedback: WeekFeedback }) {
  const stats = [
    feedback.sessionsPlanned === null ? `${feedback.sessionsDone} antrenman` : `${feedback.sessionsDone}/${feedback.sessionsPlanned} antrenman`,
    feedback.volumeChangePct === null ? null : `Hacim ${feedback.volumeChangePct > 0 ? "+" : ""}${feedback.volumeChangePct}%`,
    feedback.records.length > 0 ? `${feedback.records.length} rekor` : null,
  ].filter((s): s is string => s !== null);
  return (
    <View style={styles.feedback}>
      <Text style={styles.eyebrow}>GEÇEN HAFTA</Text>
      <Text style={styles.headline}>{feedback.headline}</Text>
      <View style={styles.stats}>
        {stats.map((s) => (
          <View key={s} style={styles.stat}>
            <Text style={styles.statLabel}>{s}</Text>
          </View>
        ))}
      </View>
      {feedback.notes.map((n) => (
        <Text key={n} style={styles.note}>
          • {n}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.lg, padding: space(4), gap: space(3) },
  head: { flexDirection: "row", alignItems: "center", gap: space(3) },
  headText: { flex: 1, gap: space(0.5) },
  eyebrow: { ...type.label, color: colors.fgMuted },
  range: { ...type.displayMd, color: colors.fg },
  badge: { borderRadius: radius.pill, paddingHorizontal: space(3), paddingVertical: space(1) },
  badgeLabel: { ...type.label, letterSpacing: 0 },
  hint: { ...type.small, color: colors.fgMuted, marginTop: -space(2) },
  feedback: { backgroundColor: colors.surface2, borderRadius: radius.md, padding: space(3), gap: space(2) },
  headline: { ...type.bodyStrong, color: colors.fg },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: space(2) },
  stat: { backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: space(3), paddingVertical: space(1) },
  statLabel: { ...type.small, fontWeight: "600", color: colors.fg },
  note: { ...type.small, color: colors.fgMuted },
  empty: { ...type.body, color: colors.fgMuted },
  day: { flexDirection: "row", alignItems: "center", gap: space(3), minHeight: 56, padding: space(2), marginHorizontal: -space(2), borderRadius: radius.md },
  dayToday: { backgroundColor: colors.successSoft },
  pressed: { backgroundColor: colors.surface2 },
  date: { width: 48, height: 48, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", alignSelf: "flex-start" },
  dateToday: { backgroundColor: colors.cta, borderColor: colors.cta },
  dateDone: { backgroundColor: colors.ink, borderColor: colors.ink },
  dateDay: { ...type.label, letterSpacing: 0, color: colors.fgMuted },
  dateNum: { ...type.displayMd, color: colors.fg },
  muted: { color: colors.fgSubtle },
  dayText: { flex: 1, minWidth: 0, gap: space(1) },
  dayTitleRow: { flexDirection: "row", alignItems: "baseline", gap: space(2) },
  dayName: { ...type.bodyStrong, color: colors.fg, flexShrink: 1 },
  status: { ...type.small, fontWeight: "600", color: colors.successText },
  exercise: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: space(2), rowGap: space(0.5) },
  exerciseText: { ...type.small, color: colors.fgMuted, flexShrink: 1 },
  exerciseName: { color: colors.fg, fontWeight: "600" },
  chip: { borderRadius: radius.pill, paddingHorizontal: space(2), paddingVertical: space(0.5) },
  chipLabel: { ...type.label, fontSize: 11, letterSpacing: 0 },
});
