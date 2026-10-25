import { router } from "expo-router";
import { useState } from "react";
import DayBody from "@/components/dashboard/DayBody";
import DayHero from "@/components/dashboard/DayHero";
import DaySwitcher from "@/components/dashboard/DaySwitcher";
import Screen from "@/components/ui/Screen";
import { dayLabel, dayTitle, shiftDay } from "@/hooks/historyLogic";
import { useDashboard } from "@/hooks/useDashboard";
import { usePastDay } from "@/hooks/usePastDay";
import { useToday } from "@/hooks/useToday";

/**
 * Bugün (US3, FR-018): today's calories in the band, the macro tiles and all four slots with their
 * meals; a slot's "+" opens the search for that slot. The ‹ › switcher shows earlier days (read
 * only, against that day's targets). Saving, editing or deleting a meal refreshes it.
 */
export default function Today() {
  const { localDate: today } = useToday();
  // null follows today, also across midnight; a date is an earlier day picked with ‹.
  const [picked, setPicked] = useState<string | null>(null);
  const shown = picked !== null && picked < today ? picked : today;
  const isToday = shown === today;
  const current = useDashboard();
  const past = usePastDay(isToday ? undefined : shown);
  const day = isToday ? current : past;

  const go = (delta: number) => {
    const next = shiftDay(shown, delta, today);
    setPicked(next === today ? null : next);
  };
  const hero = (
    <>
      <DaySwitcher title={dayTitle(shown)} onPrevious={() => go(-1)} onNext={isToday ? null : () => go(1)} />
      {day.resolved && <DayHero eaten={day.eaten.calories} target={day.resolved.targets.calories} dayType={day.resolved.dayType} />}
    </>
  );

  return (
    <Screen title={dayLabel(shown, today)} hero={hero}>
      <DayBody
        day={day}
        subject="Günün"
        onAdd={isToday ? (slot) => router.push({ pathname: "/log/search", params: { slot } }) : undefined}
        empty={{ title: "Bu gün öğün yok", body: "O gün kayıt girilmemiş." }}
      />
    </Screen>
  );
}
