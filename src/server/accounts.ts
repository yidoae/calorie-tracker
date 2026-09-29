import type { User } from "@prisma/client";
import type { Credentials } from "@/types/auth";
import { EMPTY_SETTINGS, parseSettingsJSON, type UserSettings } from "@/types/settings";
import { burnPasswordCheck, hashPassword, verifyPassword } from "./auth";
import { db } from "./db";

/*
 * Account use cases: sign-up, sign-in, saved settings. Route Handlers call these; the password
 * and session primitives live in auth.ts.
 */

/** Creates an account. `settings` carries plans a guest made on this device into it. */
export async function registerUser(creds: Credentials, settings: UserSettings): Promise<User | "taken"> {
  if (await db.user.findUnique({ where: { username: creds.username }, select: { id: true } })) return "taken";
  const hasSettings = settings.profiles.length > 0 || settings.customPlan !== null;
  try {
    return await db.user.create({
      data: {
        username: creds.username,
        passwordHash: await hashPassword(creds.password),
        settings: hasSettings ? JSON.stringify(settings) : null,
      },
    });
  } catch {
    return "taken"; // unique-constraint race with a concurrent sign-up
  }
}

/**
 * The user for these credentials, or null. Unknown usernames cost the same time as a wrong
 * password, so response timing doesn't reveal which usernames exist.
 */
export async function authenticate(creds: Credentials): Promise<User | null> {
  const user = await db.user.findUnique({ where: { username: creds.username } });
  if (!user) {
    await burnPasswordCheck(creds.password);
    return null;
  }
  return (await verifyPassword(user.passwordHash, creds.password)) ? user : null;
}

export function settingsOf(user: Pick<User, "settings">): UserSettings {
  return user.settings ? parseSettingsJSON(user.settings) : EMPTY_SETTINGS;
}

export async function saveSettings(userId: string, settings: UserSettings): Promise<void> {
  await db.user.update({ where: { id: userId }, data: { settings: JSON.stringify(settings) } });
}
