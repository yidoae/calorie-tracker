import type { ResolvedTargets } from "@calorie/core/nutrition/targets";
import type { Macros } from "@calorie/core/schemas/nutrition";
import { router } from "expo-router";
import { ActivityIndicator, StyleSheet } from "react-native";
import StateMessage from "@/components/ui/StateMessage";
import type { SlotGroup } from "@/hooks/mealLogic";
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
  empty: { title: string; body: string };
}

/** A day's ring, macro bars and meals by slot, with loading, error and empty states (Bugün and a past day). */
export default function DayBody({ day, subject, empty }: Props) {
  if (day.loading) return <ActivityIndicator accessibilityLabel={`${subject} yükleniyor`} color={colors.fg} style={styles.loading} />;
  if (day.error || !day.resolved) {
    return <StateMessage kind="error" title={`${subject} yüklenemedi`} body={day.error?.message} actionLabel="Tekrar dene" onAction={day.retry} />;
  }
  return (
    <>
      <DaySummary eaten={day.eaten} targets={day.resolved.targets} dayType={day.resolved.dayType} />
      {day.groups.length === 0 ? (
        <StateMessage kind="empty" title={empty.title} body={empty.body} />
      ) : (
        day.groups.map((group) => (
          <SlotMeals key={group.slot} group={group} onOpen={(id) => router.push({ pathname: "/meal/[id]", params: { id } })} />
        ))
      )}
    </>
  );
}

const styles = StyleSheet.create({
  loading: { marginVertical: space(10) },
});
