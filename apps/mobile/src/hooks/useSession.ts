import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState } from "react";
import { getSession, onSessionChange, type Session } from "@/services/authService";
import { getMyProfile, type Profile } from "@/services/profileService";
import { clearMealDraft } from "./useMealDraft";

/**
 * Where the user is in the app's lifecycle; the root layout routes on this alone
 * (contracts/screens.md): signed out → welcome, set-up incomplete → setup, else the tabs.
 * "recovery": signed in by a password-reset link, kept on the new-password screen until the
 * password is changed (FR-003).
 */
type SessionStatus = "loading" | "signedOut" | "recovery" | "needsSetup" | "ready" | "error";

export interface SessionState {
  status: SessionStatus;
  session: Session | null;
  profile: Profile | null;
  /** Shown on the error screen when the profile could not be loaded. */
  error: Error | null;
  retry: () => void;
}

/** Used once, by SessionProvider. */
export function useSessionController(): SessionState {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [recovering, setRecovering] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;
    void getSession().then((s) => active && setSession(s));
    const unsubscribe = onSessionChange((s, event) => {
      setSession(s);
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
      if (event === "USER_UPDATED" || event === "SIGNED_OUT") setRecovering(false);
      // Signed out here or elsewhere (revoked, expired): nothing personal stays cached (FR-005).
      if (event === "SIGNED_OUT") {
        queryClient.clear();
        clearMealDraft();
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [queryClient]);

  const userId = session?.user.id ?? null;
  const profile = useQuery(profileQuery(userId));

  let status: SessionStatus;
  if (session === undefined) status = "loading";
  else if (session === null) status = "signedOut";
  else if (recovering) status = "recovery";
  else if (profile.isError) status = "error";
  else if (!profile.data) status = "loading";
  else status = profile.data.onboardingCompleted ? "ready" : "needsSetup";

  return {
    status,
    session: session ?? null,
    profile: profile.data ?? null,
    error: profile.error,
    retry: () => void profile.refetch(),
  };
}

const profileQuery = (userId: string | null) => ({
  queryKey: ["profile", userId],
  queryFn: () => getMyProfile(userId as string),
  enabled: userId !== null,
});

/**
 * The signed-in user's profile, read by the calling screen's own query observer. The session
 * context hears about a cache write a tick later (query notifications are batched), so a screen
 * opened right after a save would still see the old profile there; this reads the cache at mount.
 */
export function useProfile(): Profile | null {
  const { session } = useSession();
  return useQuery(profileQuery(session?.user.id ?? null)).data ?? null;
}

export const SessionContext = createContext<SessionState | null>(null);

export function useSession(): SessionState {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider");
  return value;
}
