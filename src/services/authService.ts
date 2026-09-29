import { authResponseSchema, meResponseSchema, type PublicUser } from "@/types/auth";
import { EMPTY_SETTINGS, parseSettings, type UserSettings } from "@/types/settings";
import { request } from "./http";

/** Account endpoints (/api/auth/*, /api/me/*). */
export const authService = {
  async me(): Promise<{ user: PublicUser | null; settings: UserSettings }> {
    const res = await request("/api/auth/me", meResponseSchema);
    return { user: res.user, settings: res.user ? parseSettings(res.settings) : EMPTY_SETTINGS };
  },

  async login(username: string, password: string): Promise<PublicUser> {
    return (await request("/api/auth/login", authResponseSchema, { json: { username, password } })).user;
  },

  /** `settings`: plans saved on this device before sign-up, carried into the account. */
  async register(username: string, password: string, settings: UserSettings | null): Promise<PublicUser> {
    return (await request("/api/auth/register", authResponseSchema, { json: { username, password, settings } })).user;
  },

  logout(): Promise<void> {
    return request("/api/auth/logout", null, { method: "POST" });
  },

  saveSettings(settings: UserSettings): Promise<void> {
    return request("/api/me/settings", null, { method: "PUT", json: settings });
  },
};
