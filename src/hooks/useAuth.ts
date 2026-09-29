"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { authService } from "@/services/authService";
import type { PublicUser } from "@/types/auth";
import { EMPTY_SETTINGS, type UserSettings } from "@/types/settings";
import { useToast } from "./useToast";

export type AuthStatus = "loading" | "guest" | "user";
/** "guard" is the "no membership" panel shown when a visitor tries a members-only action. */
export type AuthView = "guard" | "login" | "register";

export interface AuthApi {
  status: AuthStatus;
  user: PublicUser | null;
  /** The signed-in user's saved plans (empty for guests). */
  settings: UserSettings;
  /** Which auth dialog is open, if any. */
  dialog: AuthView | null;
  /** Applies an update optimistically and saves it to the account. */
  updateSettings: (update: (current: UserSettings) => UserSettings) => void;
  /**
   * Runs `action` if signed in. Otherwise stops, shows the "no membership" panel and runs
   * `action` once the visitor signs in or registers, so they continue where they left off.
   */
  requireAuth: (action?: () => void) => boolean;
  /** Opens the dialog fresh (e.g. from the header); forgets any pending action. */
  openAuth: (view: AuthView) => void;
  /** Moves between guard / login / register inside the open dialog, keeping the pending action. */
  switchAuthView: (view: AuthView) => void;
  closeAuth: () => void;
  /** Called by the auth form after the server set the session cookie. */
  completeAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthApi | null>(null);

/** Account state and the members-only guard; used once, by AuthProvider. */
export function useAuthController(): AuthApi {
  const toast = useToast();
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<PublicUser | null>(null);
  const [settings, setSettings] = useState<UserSettings>(EMPTY_SETTINGS);
  const [dialog, setDialog] = useState<AuthView | null>(null);
  // Refs so actions resumed after sign-in see the fresh account, not a stale closure.
  const statusRef = useRef<AuthStatus>("loading");
  const settingsRef = useRef<UserSettings>(EMPTY_SETTINGS);
  const pendingRef = useRef<(() => void) | null>(null);
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
            setDialog("login");
            toast.error("Oturumun sona erdi", "Değişikliklerini kaydetmek için tekrar giriş yap.");
          } else {
            toast.error("Plan kaydedilemedi", "Bağlantını kontrol edip tekrar dene.");
          }
        });
    },
    [apply, toast],
  );

  const requireAuth = useCallback<AuthApi["requireAuth"]>((action) => {
    if (statusRef.current === "user") {
      action?.();
      return true;
    }
    pendingRef.current = action ?? null;
    setDialog("guard");
    return false;
  }, []);

  const openAuth = useCallback((view: AuthView) => {
    pendingRef.current = null;
    setDialog(view);
  }, []);

  const switchAuthView = useCallback((view: AuthView) => setDialog(view), []);

  const closeAuth = useCallback(() => {
    pendingRef.current = null;
    setDialog(null);
  }, []);

  const completeAuth = useCallback(async () => {
    const account = await authService.me();
    apply(account);
    setDialog(null);
    toast.success(`Hoş geldin, ${account.user?.username ?? ""}!`);
    const pending = pendingRef.current;
    pendingRef.current = null;
    pending?.();
  }, [apply, toast]);

  const logout = useCallback(async () => {
    await authService.logout().catch(() => {});
    apply({ user: null, settings: EMPTY_SETTINGS });
    toast.info("Çıkış yapıldı");
  }, [apply, toast]);

  return useMemo(
    () => ({ status, user, settings, dialog, updateSettings, requireAuth, openAuth, switchAuthView, closeAuth, completeAuth, logout }),
    [status, user, settings, dialog, updateSettings, requireAuth, openAuth, switchAuthView, closeAuth, completeAuth, logout],
  );
}

export function useAuth(): AuthApi {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
