"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { authPath, ROUTES } from "@/lib/routes";
import { authService } from "@/services/authService";
import type { PublicUser } from "@/types/auth";
import { EMPTY_SETTINGS, type UserSettings } from "@/types/settings";
import { useToast } from "./useToast";

export type AuthStatus = "loading" | "guest" | "user";
/** The two auth pages: sign-in (/giris-yap) and sign-up (/kayit-ol). */
export type AuthView = "login" | "register";

export interface AuthApi {
  status: AuthStatus;
  user: PublicUser | null;
  /** The signed-in user's saved plans (empty for guests). */
  settings: UserSettings;
  /** Whether the "no membership" panel is open (a guest tried a members-only action). */
  guardOpen: boolean;
  /** Applies an update optimistically and saves it to the account. */
  updateSettings: (update: (current: UserSettings) => UserSettings) => void;
  /**
   * Runs `action` if signed in. Otherwise stops and shows the "no membership" panel, whose
   * buttons lead to the auth pages; after signing in the visitor returns to this page.
   */
  requireAuth: (action?: () => void) => boolean;
  /** Goes to the sign-in or sign-up page, remembering the current page to come back to. */
  openAuth: (view: AuthView) => void;
  closeGuard: () => void;
  /** Puts settings the server just saved (e.g. by the first-time setup) into the local state. */
  replaceSettings: (settings: UserSettings) => void;
  /** Called by the auth form after the server set the session cookie (the form navigates). */
  completeAuth: () => Promise<void>;
  logout: () => Promise<void>;
  /** Drops the local session after the server already ended it (account deleted). */
  forgetSession: () => void;
}

export const AuthContext = createContext<AuthApi | null>(null);

/** Account state and the members-only guard; used once, by AuthProvider. */
export function useAuthController(): AuthApi {
  const toast = useToast();
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<PublicUser | null>(null);
  const [settings, setSettings] = useState<UserSettings>(EMPTY_SETTINGS);
  const [guardOpen, setGuardOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  // Refs so callbacks always see the fresh account, not a stale closure.
  const statusRef = useRef<AuthStatus>("loading");
  const settingsRef = useRef<UserSettings>(EMPTY_SETTINGS);
  const saveChain = useRef<Promise<unknown>>(Promise.resolve());

  const apply = useCallback((next: { user: PublicUser | null; settings: UserSettings }) => {
    statusRef.current = next.user ? "user" : "guest";
    settingsRef.current = next.settings;
    setUser(next.user);
    setSettings(next.settings);
    setStatus(statusRef.current);
  }, []);

  useEffect(() => {
    authService
      .me()
      .then(apply)
      .catch(() => apply({ user: null, settings: EMPTY_SETTINGS }));
  }, [apply]);

  const updateSettings = useCallback<AuthApi["updateSettings"]>(
    (update) => {
      if (statusRef.current !== "user") return;
      const next = update(settingsRef.current);
      settingsRef.current = next;
      setSettings(next);
      // Serialize saves so a slow earlier request can't overwrite a newer one.
      saveChain.current = saveChain.current
        .then(() => authService.saveSettings(next))
        .catch((err: unknown) => {
          if ((err as { status?: number }).status === 401) {
            apply({ user: null, settings: EMPTY_SETTINGS });
            router.push(authPath("login", pathname));
            toast.error("Oturumun sona erdi", "Değişikliklerini kaydetmek için tekrar giriş yap.");
          } else {
            toast.error("Plan kaydedilemedi", "Bağlantını kontrol edip tekrar dene.");
          }
        });
    },
    [apply, toast, router, pathname],
  );

  const requireAuth = useCallback<AuthApi["requireAuth"]>((action) => {
    if (statusRef.current === "user") {
      action?.();
      return true;
    }
    setGuardOpen(true);
    return false;
  }, []);

  const openAuth = useCallback(
    (view: AuthView) => {
      setGuardOpen(false);
      router.push(authPath(view, pathname));
    },
    [router, pathname],
  );

  const closeGuard = useCallback(() => setGuardOpen(false), []);

  const replaceSettings = useCallback((next: UserSettings) => {
    settingsRef.current = next;
    setSettings(next);
  }, []);

  const completeAuth = useCallback(async () => {
    const account = await authService.me();
    apply(account);
    toast.success(`Hoş geldin, ${account.user?.username ?? ""}!`);
  }, [apply, toast]);

  const logout = useCallback(async () => {
    await authService.logout().catch(() => {});
    apply({ user: null, settings: EMPTY_SETTINGS });
    router.push(ROUTES.landing);
    toast.info("Çıkış yapıldı");
  }, [apply, toast, router]);

  const forgetSession = useCallback(() => {
    apply({ user: null, settings: EMPTY_SETTINGS });
    router.push(ROUTES.landing);
  }, [apply, router]);

  return useMemo(
    () => ({ status, user, settings, guardOpen, updateSettings, requireAuth, openAuth, closeGuard, replaceSettings, completeAuth, logout, forgetSession }),
    [status, user, settings, guardOpen, updateSettings, requireAuth, openAuth, closeGuard, replaceSettings, completeAuth, logout, forgetSession],
  );
}

export function useAuth(): AuthApi {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
