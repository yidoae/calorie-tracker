import { router } from "expo-router";
import DayBody from "@/components/dashboard/DayBody";
import DayHero from "@/components/dashboard/DayHero";
import Screen from "@/components/ui/Screen";
import { useDashboard } from "@/hooks/useDashboard";

/**
 * Bugün (US3, FR-018): today's calories in the band, the macro tiles and all four slots with their
 * meals; a slot's "+" opens the search for that slot. Saving, editing or deleting a meal refreshes it.
 */
export default function Today() {
  const day = useDashboard();
  const hero = day.resolved && <DayHero eaten={day.eaten.calories} target={day.resolved.targets.calories} dayType={day.resolved.dayType} />;

  return (
    <Screen title="Bugün" hero={hero}>
      <DayBody day={day} subject="Günün" onAdd={(slot) => router.push({ pathname: "/log/search", params: { slot } })} />
    </Screen>
  );
}
