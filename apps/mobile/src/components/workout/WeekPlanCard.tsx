import Ionicons from "@expo/vector-icons/Ionicons";
import { dayToDate, LOCALE } from "@calorie/core/dates";
import type { WeekIntensity, WeekPlan } from "@calorie/core/schemas/workout";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, space, type } from "@/theme";

const INTENSITY: Record<WeekIntensity, string> = {
  normal: "Normal hafta: hedefler son antrenmanına göre ilerliyor",
  light: "Hafif hafta: geçen hafta eksik kaldı, kilolar sabit",
  deload: "Deload haftası: yük yaklaşık %10 az, bir set eksik",
};
const dateLabel = (day: string) => dayToDate(day).toLocaleDateString(LOCALE, { weekday: "long", day: "numeric", month: "short" });

/**
 * A week of the training plan (008): the feedback on the week before, the intensity and each
 * planned day; a day opens the logger with its targets. Done days (a workout logged that date) get a tick.
 */
export default function WeekPlanCard({ title, week, doneDates, today }: { title: string; week: WeekPlan; doneDates: ReadonlySet<string>; today: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>{title}</Text>
      {week.feedback && (
        <View style={styles.feedback}>
          <Text style={styles.headline}>{week.feedback.headline}</Text>
          {week.feedback.notes.map((n) => (
            <Text key={n} style={styles.note}>
              • {n}
            </Text>
          ))}
        </View>
      )}
      <Text style={styles.intensity}>{INTENSITY[week.intensity]}</Text>
      {week.days.map((day) => {
        const done = doneDates.has(day.date);
        return (
          <Pressable
            key={day.date}
            accessibilityRole="button"
            accessibilityLabel={`${dateLabel(day.date)}, ${day.name}${done ? ", yapıldı" : ""}, antrenmanı aç`}
            onPress={() => router.push({ pathname: "/workout/session", params: { date: day.date } })}
            style={({ pressed }) => [styles.dayRow, pressed && styles.pressed]}
          >
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, day.date === today && styles.today]}>
                {dateLabel(day.date)} · {day.name}
              </Text>
              <Text style={styles.rowHint}>{day.exercises.map((e) => e.name).join(", ")}</Text>
            </View>
            <Ionicons name={done ? "checkmark-circle" : "chevron-forward"} size={20} color={done ? colors.successText : colors.fg} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.lg, padding: space(4), gap: space(1) },
  eyebrow: { ...type.label, color: colors.fgMuted },
  feedback: { backgroundColor: colors.surface2, borderRadius: radius.md, padding: space(3), gap: space(1), marginVertical: space(1) },
  headline: { ...type.bodyStrong, color: colors.fg },
  note: { ...type.small, color: colors.fgMuted },
  intensity: { ...type.small, color: colors.fg, marginBottom: space(1) },
  dayRow: { flexDirection: "row", alignItems: "center", gap: space(3), minHeight: 56, paddingVertical: space(2), borderTopWidth: 1, borderTopColor: colors.border },
  pressed: { backgroundColor: colors.surface2 },
  rowText: { flex: 1, gap: space(0.5) },
  rowTitle: { ...type.bodyStrong, color: colors.fg },
  today: { textDecorationLine: "underline" },
  rowHint: { ...type.small, color: colors.fgMuted },
});
