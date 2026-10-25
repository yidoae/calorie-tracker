import { useEffect } from "react";
import { askPermission, cancel, getPermission, scheduleWeekly } from "@/services/notificationService";
import { reminderStep, WEEKLY_REMINDER } from "./notificationLogic";

/**
 * The Sunday 19:00 "Haftalık planın hazır" reminder (008, T006), kept in line with the program from
 * the Antrenman tab: asked for once when a program exists, scheduled weekly, cancelled without a
 * program. A failure only means no reminder, so it is not shown.
 */
export function useWeeklyReminder(hasProgram: boolean | null) {
  useEffect(() => {
    let cancelled = false;
    async function sync() {
      let permission = await getPermission();
      let step = reminderStep(hasProgram, permission);
      if (step === "ask") {
        permission = await askPermission();
        step = reminderStep(hasProgram, permission);
      }
      if (cancelled) return;
      if (step === "schedule") await scheduleWeekly(WEEKLY_REMINDER);
      if (step === "cancel") await cancel(WEEKLY_REMINDER.id);
    }
    sync().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [hasProgram]);
}
