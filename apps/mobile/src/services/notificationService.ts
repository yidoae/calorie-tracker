import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

/*
 * Local notifications (008, T006): the only module that imports expo-notifications. Local
 * notifications work in Expo Go too; push would need a development build and is not used.
 */

const CHANNEL = "weekly-plan";

export interface Permission {
  granted: boolean;
  canAskAgain: boolean;
  status: "granted" | "denied" | "undetermined";
}

const toPermission = (p: Notifications.NotificationPermissionsStatus): Permission => ({ granted: p.granted, canAskAgain: p.canAskAgain, status: p.status });

export async function getPermission(): Promise<Permission> {
  return toPermission(await Notifications.getPermissionsAsync());
}

/** Shows the system prompt; Android 13+ shows it only once a channel exists. */
export async function askPermission(): Promise<Permission> {
  if (Platform.OS === "android") await Notifications.setNotificationChannelAsync(CHANNEL, { name: "Haftalık plan", importance: Notifications.AndroidImportance.DEFAULT });
  return toPermission(await Notifications.requestPermissionsAsync());
}

/** Schedules (or replaces, by id) a notification every week at the given local time. */
export async function scheduleWeekly(reminder: { id: string; title: string; body: string; weekday: number; hour: number; minute: number }): Promise<void> {
  if (Platform.OS === "android") await Notifications.setNotificationChannelAsync(CHANNEL, { name: "Haftalık plan", importance: Notifications.AndroidImportance.DEFAULT });
  await Notifications.scheduleNotificationAsync({
    identifier: reminder.id,
    content: { title: reminder.title, body: reminder.body },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: reminder.weekday, hour: reminder.hour, minute: reminder.minute, channelId: CHANNEL },
  });
}

export async function cancel(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}
