// Preview stand-in for apps/mobile/src/services/profileService.ts: a profile that finished setup,
// the same answers the fake plan was built from.
import type { Profile, SetupAnswers } from "@/services/profileService";

export const SAMPLE_PROFILE: Profile = {
  id: "00000000-0000-4000-8000-000000000001",
  sex: "female",
  birthYear: 1996,
  heightCm: 165,
  weightKg: 70,
  goalWeightKg: 62,
  activityLevel: "moderate",
  dietStyle: "highProtein",
  fatPerKg: 1.2,
  timeZone: "Europe/Istanbul",
  onboardingCompleted: true,
  sensitiveWarningAck: false,
};

const wait = () => new Promise((resolve) => setTimeout(resolve, 900));

export async function getMyProfile(userId: string): Promise<Profile> {
  return { ...SAMPLE_PROFILE, id: userId };
}

export async function saveSetupAnswers(userId: string, _answers: SetupAnswers): Promise<Profile> {
  await wait();
  return { ...SAMPLE_PROFILE, id: userId, onboardingCompleted: false };
}
