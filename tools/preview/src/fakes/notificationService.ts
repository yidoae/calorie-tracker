import type * as Notifications from "@/services/notificationService";

// The web preview has no notifications: never allowed, nothing scheduled.
export async function getPermission(): ReturnType<typeof Notifications.getPermission> {
  return { granted: false, canAskAgain: false, status: "denied" };
}
export async function askPermission(): ReturnType<typeof Notifications.askPermission> {
  return { granted: false, canAskAgain: false, status: "denied" };
}
export async function scheduleWeekly(..._args: Parameters<typeof Notifications.scheduleWeekly>): ReturnType<typeof Notifications.scheduleWeekly> {}
export async function cancel(..._args: Parameters<typeof Notifications.cancel>): ReturnType<typeof Notifications.cancel> {}
