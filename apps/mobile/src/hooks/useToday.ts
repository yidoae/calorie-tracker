import { useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";
import { deviceTimeZone } from "./deviceTimeZone";
import { localDayKey, msUntilNextDay, type LocalDay } from "./mealLogic";

/**
 * Today's local date and the device's time zone (FR-016). Moves on to the next day at local
 * midnight, and when the app comes back to the foreground (the timer does not run in the background).
 */
export function useToday(): LocalDay {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setTimeout(() => setNow(new Date()), msUntilNextDay(now));
    return () => clearTimeout(timer);
  }, [now]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") setNow(new Date());
    });
    return () => sub.remove();
  }, []);

  const timeZone = deviceTimeZone();
  const localDate = localDayKey(now, timeZone);
  return useMemo(() => ({ localDate, timeZone }), [localDate, timeZone]);
}
