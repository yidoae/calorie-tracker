import "react-native-get-random-values";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import * as aesjs from "aes-js";
import * as SecureStore from "expo-secure-store";
import { AppState } from "react-native";

/*
 * The one Supabase client (constitution I: only src/services talks to Supabase). The session is
 * stored encrypted (FR-004, research.md §1): a random AES-256 key per entry in the device's secure
 * storage, the AES-CTR ciphertext in AsyncStorage, because secure storage can refuse values over
 * about 2 KB on some iOS releases.
 */
class EncryptedSessionStorage {
  async getItem(key: string): Promise<string | null> {
    const encrypted = await AsyncStorage.getItem(key);
    if (!encrypted) return null;
    const keyHex = await SecureStore.getItemAsync(key);
    if (!keyHex) return null;
    const cipher = new aesjs.ModeOfOperation.ctr(aesjs.utils.hex.toBytes(keyHex), new aesjs.Counter(1));
    return aesjs.utils.utf8.fromBytes(cipher.decrypt(aesjs.utils.hex.toBytes(encrypted)));
  }

  async setItem(key: string, value: string): Promise<void> {
    const keyBytes = crypto.getRandomValues(new Uint8Array(32));
    const cipher = new aesjs.ModeOfOperation.ctr(keyBytes, new aesjs.Counter(1));
    const encrypted = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
    await SecureStore.setItemAsync(key, aesjs.utils.hex.fromBytes(keyBytes));
    await AsyncStorage.setItem(key, aesjs.utils.hex.fromBytes(encrypted));
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
    await SecureStore.deleteItemAsync(key);
  }
}

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? "";

/** False when apps/mobile/.env is missing; requests then fail with a clear message. */
export const supabaseConfigured = url.length > 0 && key.length > 0;

const storage = new EncryptedSessionStorage();
const SESSION_KEY = "kalori-takip-session";

export const supabase = createClient(supabaseConfigured ? url : "https://not-configured.invalid", supabaseConfigured ? key : "missing", {
  auth: {
    storage,
    storageKey: SESSION_KEY,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // E-mail links come back as kaloritakip://auth/…?code=…; the app exchanges the code with the
    // verifier stored here when the e-mail was requested (authService.exchangeAuthCode).
    flowType: "pkce",
  },
});

/** Deletes the stored session (its key in secure storage and the ciphertext) without asking the server. */
export function forgetStoredSession(): Promise<void> {
  return storage.removeItem(SESSION_KEY);
}

// Refresh tokens only while the app is in the foreground.
AppState.addEventListener("change", (state) => {
  if (state === "active") void supabase.auth.startAutoRefresh();
  else void supabase.auth.stopAutoRefresh();
});
