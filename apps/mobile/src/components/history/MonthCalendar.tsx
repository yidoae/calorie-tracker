import { WEEKDAY_SHORT } from "@calorie/core/labels";
import type { DayRating } from "@calorie/core/nutrition/dayRating";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { dayTitle, type CalendarDay } from "@/hooks/historyLogic";
import { colors, radius, space, type } from "@/theme";

interface Props {
  title: string;
  days: (CalendarDay | null)[];
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  onOpen: (localDate: string) => void;
}

const MARKS: Record<DayRating, { label: string; color: string }> = {
  onTarget: { label: "Hedefte (±%5)", color: colors.success },
  under: { label: "Hedefin altında", color: colors.warningText },
  over: { label: "Hedefin üstünde", color: colors.danger },
};

/** A month, Monday first: logged days carry a mark for how they went, today is outlined (FR-019). */
export default function MonthCalendar({ title, days, canGoForward, onBack, onForward, onOpen }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <NavButton icon="chevron-back" label="Önceki ay" onPress={onBack} />
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        <NavButton icon="chevron-forward" label="Sonraki ay" onPress={onForward} disabled={!canGoForward} />
      </View>
      <View style={styles.row} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {WEEKDAY_SHORT.map((name) => (
          <Text key={name} style={styles.weekday}>
            {name}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {days.map((day, i) => (day ? <DayCell key={day.localDate} day={day} onOpen={onOpen} /> : <View key={`pad-${i}`} style={styles.cell} />))}
      </View>
      <View style={styles.legend}>
        {Object.values(MARKS).map((mark) => (
          <View key={mark.label} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: mark.color }]} />
            <Text style={styles.legendText}>{mark.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function DayCell({ day, onOpen }: { day: CalendarDay; onOpen: (localDate: string) => void }) {
  const mark = day.rating ? MARKS[day.rating] : null;
  const state = [day.isToday && "bugün", mark ? mark.label.toLocaleLowerCase("tr-TR") : "kayıt yok"].filter(Boolean).join(", ");
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${dayTitle(day.localDate)}, ${state}`}
      accessibilityState={{ disabled: day.isFuture }}
      disabled={day.isFuture}
      onPress={() => onOpen(day.localDate)}
      style={({ pressed }) => [styles.cell, day.isToday && styles.today, pressed && styles.pressed]}
    >
      <Text style={[styles.number, day.isFuture && styles.future]}>{day.day}</Text>
      <View style={[styles.dot, { backgroundColor: mark?.color ?? colors.transparent }]} />
    </Pressable>
  );
}

interface NavProps {
  icon: "chevron-back" | "chevron-forward";
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

function NavButton({ icon, label, onPress, disabled = false }: NavProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.nav, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={22} color={disabled ? colors.border : colors.fg} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.lg, padding: space(3), gap: space(2) },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { ...type.displayMd, color: colors.fg },
  nav: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: radius.pill },
  row: { flexDirection: "row" },
  weekday: { ...type.label, flex: 1, textAlign: "center", color: colors.fgMuted, letterSpacing: 0 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: `${100 / 7}%`, minHeight: 48, alignItems: "center", justifyContent: "center", gap: space(1), borderRadius: radius.md },
  today: { borderWidth: 2, borderColor: colors.ink },
  pressed: { backgroundColor: colors.surface2 },
  number: { ...type.bodyStrong, color: colors.fg },
  future: { color: colors.fgSubtle, fontWeight: "400" },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: space(3), paddingTop: space(2), borderTopWidth: 1, borderTopColor: colors.border },
  legendItem: { flexDirection: "row", alignItems: "center", gap: space(1.5) },
  legendText: { ...type.small, color: colors.fgMuted },
});
