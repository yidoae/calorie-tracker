import type { User } from "@prisma/client";
import type { Credentials } from "@/types/auth";
import type { OnboardingInput } from "@/types/onboarding";
import { EMPTY_SETTINGS, parseSettingsJSON, type UserSettings } from "@/types/settings";
import { onboardingToPlanInputs } from "@/lib/nutrition/onboarding";
import { toCsv } from "@/lib/csv";
import { SLOT_LABELS } from "@/lib/labels";
import { dayKey } from "@/lib/dates";
import type { ExportFormat } from "@/types/account";
import { burnPasswordCheck, hashPassword, verifyPassword } from "./auth";
import { db } from "./db";
import { listAllMeals, listImageUrls, listSavedMeals } from "./meals/repository";
import { buildFormulaPlan } from "./plans/generate";
import { deleteImage } from "./storage";
import { exportTracking } from "./tracking/repository";

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

/**
 * Finishes the first-time setup: builds the plan from the answers on the server (the client's
 * preview is never trusted), makes it the active plan and opens the panel for this account.
 */
export async function completeOnboarding(user: Pick<User, "id" | "settings">, input: OnboardingInput): Promise<UserSettings> {
  const settings: UserSettings = { ...settingsOf(user), nutritionPlan: buildFormulaPlan(onboardingToPlanInputs(input)) };
  await db.user.update({ where: { id: user.id }, data: { settings: JSON.stringify(settings), onboardingCompleted: true } });
  return settings;
}

export async function saveSettings(userId: string, settings: UserSettings): Promise<void> {
  await db.user.update({ where: { id: userId }, data: { settings: JSON.stringify(settings) } });
}

/**
 * Deletes the account and everything in it (meals, photos, weigh-ins, water, saved meals,
 * sessions). The password must match; false otherwise.
 */
export async function deleteAccount(userId: string, password: string): Promise<boolean> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  if (!user || !(await verifyPassword(user.passwordHash, password))) return false;
  const images = await listImageUrls(userId);
  await db.user.delete({ where: { id: userId } }); // cascades to every user-owned table
  await Promise.all(images.map((url) => deleteImage(url)));
  return true;
}

export interface ExportFile {
  filename: string;
  contentType: string;
  body: string;
}

/**
 * The user's data as a download. JSON carries everything (settings, meals with items, weigh-ins,
 * water, saved meals; never the password hash or sessions). CSV is one row per meal item, which
 * opens directly in a spreadsheet. Photos are not included.
 */
export async function exportUserData(user: Pick<User, "id" | "username" | "settings" | "createdAt">, format: ExportFormat): Promise<ExportFile> {
  const meals = await listAllMeals(user.id);
  const stamp = dayKey(new Date());

  if (format === "csv") {
    const rows = meals.flatMap((meal) => {
      const at = new Date(meal.createdAt);
      // Date and time both in UTC, so a row never mixes the server's zone with UTC.
      const base = [at.toISOString().slice(0, 10), at.toISOString().slice(11, 16), SLOT_LABELS[meal.slot], meal.name];
      if (meal.items.length === 0) return [[...base, "", "", meal.calories, meal.protein, meal.carbs, meal.fat]];
      return meal.items.map((item) => {
        const f = item.grams / 100;
        const r = (n: number) => Math.round(n * f * 10) / 10;
        return [...base, item.name, item.grams, Math.round(item.per100g.calories * f), r(item.per100g.protein), r(item.per100g.carbs), r(item.per100g.fat)];
      });
    });
    return {
      filename: `kalori-takip-${stamp}.csv`,
      contentType: "text/csv; charset=utf-8",
      // BOM so Excel opens Turkish characters correctly.
      body: "﻿" + toCsv(["tarih_utc", "saat_utc", "ogun", "ogun_adi", "besin", "gram", "kcal", "protein_g", "karbonhidrat_g", "yag_g"], rows),
    };
  }

  const [tracking, savedMeals] = await Promise.all([exportTracking(user.id), listSavedMeals(user.id)]);
  const data = {
    format: "kalori-takip-export",
    version: 1,
    exportedAt: new Date().toISOString(),
    account: { username: user.username, createdAt: user.createdAt.toISOString() },
    settings: settingsOf(user),
    meals: meals.map((m) => ({ ...m, imageUrl: m.imageUrl ? "(fotoğraf dışa aktarılmadı)" : null })),
    savedMeals,
    weights: tracking.weights,
    water: tracking.water,
  };
  return { filename: `kalori-takip-${stamp}.json`, contentType: "application/json; charset=utf-8", body: JSON.stringify(data, null, 2) };
}
