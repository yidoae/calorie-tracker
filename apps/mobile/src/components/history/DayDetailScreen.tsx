import { router } from "expo-router";
import DayBody from "@/components/dashboard/DayBody";
import DayHero from "@/components/dashboard/DayHero";
import Screen from "@/components/ui/Screen";
import StateMessage from "@/components/ui/StateMessage";
import { usePastDay } from "@/hooks/usePastDay";

function leave() {
  if (router.canGoBack()) router.back();
  else router.replace("/history");
}

/** A day from the calendar (US5): the dashboard's calories, macro tiles and meals, against that day's targets. */
export default function DayDetailScreen({ date }: { date: string | undefined }) {
  const day = usePastDay(date);
  const back = { label: "Takvime dön", onPress: leave };

  if (!day.valid) {
    return (
      <Screen title="Gün" back={back}>
        <StateMessage kind="error" title="Bu gün açılamıyor" body="Takvimden bugünü ya da geçmiş bir günü seç." />
      </Screen>
    );
  }

  return (
    <Screen title={day.title} back={back} hero={day.resolved && <DayHero eaten={day.eaten.calories} target={day.resolved.targets.calories} dayType={day.resolved.dayType} />}>
      <DayBody day={day} subject="Gün" empty={{ title: "Bu gün öğün yok", body: "O gün kayıt girilmemiş." }} />
    </Screen>
  );
}
