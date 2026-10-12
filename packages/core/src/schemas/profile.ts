export const GENDERS = ["male", "female"] as const;
export const ACTIVITY_LEVEL_KEYS = ["sedentary", "light", "moderate", "active", "veryActive"] as const;

export type Gender = (typeof GENDERS)[number];
export type ActivityLevel = (typeof ACTIVITY_LEVEL_KEYS)[number];

/** Accepted body measurements (inclusive). The energy formulas are validated for adults. */
export const PROFILE_LIMITS = {
  heightCm: { min: 100, max: 250 },
  weightKg: { min: 30, max: 300 },
  age: { min: 15, max: 100 },
} as const;

export function inRange(field: keyof typeof PROFILE_LIMITS, value: number): boolean {
  const { min, max } = PROFILE_LIMITS[field];
  return Number.isFinite(value) && value >= min && value <= max;
}
