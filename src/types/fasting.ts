import { z } from "./zod";

/** Eating/fasting splits; "custom" takes any start and end time. */
export const FASTING_PRESETS = ["16:8", "18:6", "20:4", "custom"] as const;
export type FastingPreset = (typeof FASTING_PRESETS)[number];

const minuteOfDay = z.number().int().min(0).max(1439);

/**
 * The intermittent-fasting module (saved in `User.settings.fasting`). Times are minutes after the
 * user's local midnight; the end may be earlier than the start (a window across midnight).
 */
export const fastingSettingsSchema = z
  .object({
    enabled: z.boolean(),
    preset: z.enum(FASTING_PRESETS),
    eatStart: minuteOfDay,
    eatEnd: minuteOfDay,
  })
  .refine((s) => s.eatStart !== s.eatEnd, { message: "Yeme penceresinin başlangıcı ve bitişi aynı olamaz", path: ["eatEnd"] });
export type FastingSettings = z.infer<typeof fastingSettingsSchema>;
