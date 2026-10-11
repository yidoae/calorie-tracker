import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";
import { appError, toAppError } from "./errors";
import { forgetStoredSession, supabase } from "./supabase";

export type { AuthChangeEvent, Session };

/*
 * Accounts (US1, research.md §1–4): e-mail and password with confirmation, native Google and
 * (iOS) Apple sign-in through ID tokens. E-mail links open the app at these deep links
 * (app/(auth)/auth/*), which must be on the project's redirect allow-list (supabase/README.md).
 */
const REDIRECT = { confirm: "kaloritakip://auth/confirm", reset: "kaloritakip://auth/reset" } as const;

/** The stored session, if any (restored from encrypted storage at startup). */
export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/** Calls `listener` whenever the user signs in, signs out or the token refreshes; returns an unsubscribe. */
export function onSessionChange(listener: (session: Session | null, event: AuthChangeEvent) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((event, session) => listener(session, event));
  return () => data.subscription.unsubscribe();
}

/** Creates an e-mail account; resolves `true` when the address must be confirmed first (FR-002). */
export async function signUpWithEmail(email: string, password: string): Promise<boolean> {
  const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: REDIRECT.confirm } });
  if (error) throw toAppError(error);
  // A registered address comes back as a user without identities, and no e-mail is sent.
  if (data.user?.identities?.length === 0) throw appError("user_already_exists");
  return data.session === null;
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw toAppError(error);
}

/** Sends the confirmation e-mail again; only the newest link works, its verifier replaces the old one. */
export async function resendConfirmation(email: string): Promise<void> {
  const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: REDIRECT.confirm } });
  if (error) throw toAppError(error);
}

/** Sends a reset link (FR-003). Supabase answers the same whether or not the address has an account. */
export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: REDIRECT.reset });
  if (error) throw toAppError(error);
}

/** Sets a new password for the signed-in user (after a reset link). */
export async function updatePassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw toAppError(error);
}

/**
 * Turns the `code` of an e-mail link into a session (PKCE). The verifier lives in this device's
 * storage, so a link opened on another device fails here; a confirmed address can still sign in.
 * A reset link signs in with the PASSWORD_RECOVERY event.
 */
export async function exchangeAuthCode(code: string): Promise<void> {
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw toAppError(error);
}

/** Signs out on this device and removes everything stored for the account (FR-005). */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) {
    // Offline with an expired token the client cannot load the session, so it keeps it. Delete it
    // from storage; the second call then finds no session and announces SIGNED_OUT.
    await forgetStoredSession();
    await supabase.auth.signOut({ scope: "local" });
  }
  if (googleSignInAvailable) {
    const { GoogleSignin } = await loadGoogleSignin();
    // Forget the chosen Google account too; failing here leaves nothing personal behind.
    await GoogleSignin.signOut().catch(() => null);
  }
}

const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "";

/** Google is offered once its OAuth clients exist (owner input; supabase/README.md). */
export const googleSignInAvailable = googleWebClientId.length > 0 && (Platform.OS !== "ios" || googleIosClientId.length > 0);

/** Loaded on first use: the native module is missing in Expo Go, where e-mail sign-in still works. */
async function loadGoogleSignin() {
  const google = await import("@react-native-google-signin/google-signin");
  google.GoogleSignin.configure({ webClientId: googleWebClientId, iosClientId: googleIosClientId || undefined });
  return google;
}

/** Native Google sign-in → Supabase ID-token sign-in (research.md §3). Cancelling resolves quietly. */
export async function signInWithGoogle(): Promise<void> {
  const { GoogleSignin, isCancelledResponse, isErrorWithCode, statusCodes } = await loadGoogleSignin();
  let idToken: string | null;
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (isCancelledResponse(response)) return;
    idToken = response.data.idToken;
  } catch (err) {
    if (isErrorWithCode(err) && err.code === statusCodes.IN_PROGRESS) return;
    if (isErrorWithCode(err) && err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) throw appError("google_unavailable");
    throw toAppError(err);
  }
  if (!idToken) throw appError("auth_failed");
  const { error } = await supabase.auth.signInWithIdToken({ provider: "google", token: idToken });
  if (error) throw toAppError(error);
}

/** Sign in with Apple exists only on iOS (research.md §2). */
export async function appleSignInAvailable(): Promise<boolean> {
  return Platform.OS === "ios" && (await AppleAuthentication.isAvailableAsync());
}

/** Native Sign in with Apple → Supabase ID-token sign-in. Cancelling resolves quietly. */
export async function signInWithApple(): Promise<void> {
  // Apple puts the SHA-256 of a one-time nonce into the token; Supabase gets the nonce itself and
  // checks that they match, so an intercepted token cannot be replayed.
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
      nonce: hashedNonce,
    });
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "ERR_REQUEST_CANCELED") return;
    throw toAppError(err);
  }
  if (!credential.identityToken) throw appError("auth_failed");
  const { error } = await supabase.auth.signInWithIdToken({ provider: "apple", token: credential.identityToken, nonce: rawNonce });
  if (error) throw toAppError(error);

  // Apple sends the name only on the first sign-in. The user is signed in either way, so a failed
  // save does not fail the sign-in.
  const { givenName, middleName, familyName } = credential.fullName ?? {};
  const fullName = [givenName, middleName, familyName].filter(Boolean).join(" ");
  if (fullName) await supabase.auth.updateUser({ data: { full_name: fullName, given_name: givenName, family_name: familyName } });
}
