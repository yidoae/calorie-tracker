import type { User } from "@prisma/client";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { getCurrentUser } from "./auth";

/**
 * Route guard for the app pages (/panel, /plan, /gelisim): a signed-in user who hasn't finished
 * the first-time setup is sent to /baslangic. Guests pass (they may look around).
 */
export async function requireOnboarded(): Promise<User | null> {
  const user = await getCurrentUser();
  if (user && !user.onboardingCompleted) redirect(ROUTES.onboarding);
  return user;
}
