import { nutritionPlanSchema, type NutritionPlan } from "./plan";
import { customPlanSchema, profileSchema, type CustomPlan, type Profile } from "./profile";
import { z } from "./zod";

const MAX_PROFILES = 20;

/** A user's saved plans, stored as JSON on their account (`User.settings`). */
export interface UserSettings {
  /** The active plan from the plan wizard; wins over the legacy profile/custom plan. */
  nutritionPlan: NutritionPlan | null;
  /** Legacy calculator profiles (before the plan wizard); still used when there's no nutritionPlan. */
  profiles: Profile[];
  activeProfileId: string | null;
  customPlan: CustomPlan | null;
}

export const EMPTY_SETTINGS: UserSettings = { nutritionPlan: null, profiles: [], activeProfileId: null, customPlan: null };

/**
 * Lenient on purpose: settings come from the DB or the client, and one malformed part shouldn't
 * wipe the others. Each part is validated separately and bad parts are dropped.
 */
const looseSettingsSchema = z.object({
  nutritionPlan: z.unknown().optional(),
  profiles: z.array(z.unknown()).optional(),
  activeProfileId: z.unknown().optional(),
  customPlan: z.unknown().optional(),
});

export function parseSettings(raw: unknown): UserSettings {
  const loose = looseSettingsSchema.safeParse(raw);
  if (!loose.success) return EMPTY_SETTINGS;
  const profiles = (loose.data.profiles ?? [])
    .map((p) => profileSchema.safeParse(p).data)
    .filter((p): p is Profile => p !== undefined)
    .slice(0, MAX_PROFILES);
  const activeProfileId = profiles.some((p) => p.id === loose.data.activeProfileId)
    ? (loose.data.activeProfileId as string)
    : (profiles[0]?.id ?? null);
  const customPlan = customPlanSchema.safeParse(loose.data.customPlan).data ?? null;
  const nutritionPlan = nutritionPlanSchema.safeParse(loose.data.nutritionPlan).data ?? null;
  return { nutritionPlan, profiles, activeProfileId, customPlan };
}

export function parseSettingsJSON(json: string | null | undefined): UserSettings {
  if (!json) return EMPTY_SETTINGS;
  try {
    return parseSettings(JSON.parse(json));
  } catch {
    return EMPTY_SETTINGS;
  }
}
