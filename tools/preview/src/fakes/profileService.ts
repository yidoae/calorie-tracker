// Preview stand-in for apps/mobile/src/services/profileService.ts: a profile that finished setup.
import type { Profile } from "@/services/profileService";

export async function getMyProfile(userId: string): Promise<Profile> {
  return {
    id: userId,
    sex: "female",
    birthYear: 1994,
    heightCm: 168,
    weightKg: 72.5,
    goalWeightKg: 65,
    activityLevel: "moderate",
    dietStyle: "highProtein",
    fatPerKg: 1.2,
    timeZone: "Europe/Istanbul",
    onboardingCompleted: true,
    sensitiveWarningAck: false,
  };
}
