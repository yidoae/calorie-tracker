import type { Permission } from "@/services/notificationService";

/*
 * The Sunday-evening reminder of the weekly training plan (008, T006). No React Native imports, so
 * tests/notificationLogic.test.ts runs this under node.
 */

/** Our weekday (Monday = 0) in expo-notifications' weekly trigger (1 = Sunday … 7 = Saturday). */
export const expoWeekday = (day: number) => ((day + 1) % 7) + 1;

/** Sunday 19:00 local, an hour after the next week is planned (Sunday 18:00). */
export const WEEKLY_REMINDER = {
  id: "weekly-plan",
  title: "Haftalık planın hazır",
  body: "Gelecek haftanın antrenmanları ve hedefleri Antrenman sekmesinde.",
  weekday: expoWeekday(6),
  hour: 19,
  minute: 0,
} as const;


/**
 * What to do with the reminder: wait while the program loads, cancel without a program; with one,
 * schedule when allowed, ask when never asked, and otherwise leave the user's "no" alone.
 */
export function reminderStep(hasProgram: boolean | null, permission: Permission): "wait" | "cancel" | "ask" | "schedule" | "none" {
  if (hasProgram === null) return "wait";
  if (!hasProgram) return "cancel";
  if (permission.granted) return "schedule";
  return permission.status === "undetermined" && permission.canAskAgain ? "ask" : "none";
}
