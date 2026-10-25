import { slotForHour } from "@calorie/core/nutrition/slots";
import type { ResolvedTargets } from "@calorie/core/nutrition/targets";
import type { MealSlot } from "@calorie/core/schemas/meal";
import type { Macros } from "@calorie/core/schemas/nutrition";
import { router } from "expo-router";
import { ActivityIndicator, StyleSheet } from "react-native";
import StateMessage from "@/components/ui/StateMessage";
import { withEmptySlots, type SlotGroup } from "@/hooks/mealLogic";
import { colors, space } from "@/theme";
import DaySummary from "./DaySummary";
import SlotMeals from "./SlotMeals";

interface Day {
  resolved: ResolvedTargets | null;
  eaten: Macros;
  groups: SlotGroup[];
  loading: boolean;
  /** The Turkish message comes from the hook's mapped error. */
  error: { message: string } | null;
  retry: () => void;
}

interface Props {
  day: Day;
  /** What is loading or failed, e.g. "Günün" → "Günün yükleniyor", "Günün yüklenemedi". */
  subject: string;
  /** Shown instead of the slots when a past day has no meals. */
  empty?: { title: string; body: string };
  /** Bugün: every slot shows with a "+"; the one for the time of day is lime. */
  onAdd?: (slot: MealSlot) => void;
}

/** A day's ring, macro bars and meals by slot, with loading, error and empty states (Bugün and a past day). */
export default function DayBody({ day, subject, empty, onAdd }: Props) {
  if (day.loading) return <ActivityIndicator accessibilityLabel={`${subject} yükleniyor`} color={colors.fg} style={styles.loading} />;
  if (day.error || !day.resolved) {
    return <StateMessage kind="error" title={`${subject} yüklenemedi`} body={day.error?.message} actionLabel="Tekrar dene" onAction={day.retry} />;
  }
  return (
    <>
      <DaySummary eaten={day.eaten} targets={day.resolved.targets} />
      {onAdd ? (
        withEmptySlots(day.groups).map((group) => (
          <SlotMeals key={group.slot} group={group} onOpen={openMeal} add={{ onPress: () => onAdd(group.slot), primary: group.slot === slotForHour(new Date().getHours()) }} />
        ))
      ) : day.groups.length === 0 ? (
        <StateMessage kind="empty" title={empty?.title ?? "Öğün yok"} body={empty?.body} />
      ) : (
        day.groups.map((group) => <SlotMeals key={group.slot} group={group} onOpen={openMeal} />)
      )}
    </>
  );
}

const openMeal = (id: string) => router.push({ pathname: "/meal/[id]", params: { id } });

const styles = StyleSheet.create({
  loading: { marginVertical: space(10) },
});
