// Preview stand-in for apps/mobile/src/services/authService.ts: same exports, no network. Actions
// wait a moment so loading states show; sign-in answers "e-mail not confirmed" to show that error.
import type { AuthChangeEvent, Session } from "@/services/authService";
import { appError } from "./errors";

const wait = () => new Promise((resolve) => setTimeout(resolve, 900));

export async function getSession(): Promise<Session | null> {
  return null;
}

export function onSessionChange(_listener: (session: Session | null, event: AuthChangeEvent) => void): () => void {
  return () => {};
}

export async function signUpWithEmail(_email: string, _password: string): Promise<boolean> {
  await wait();
  return true;
}

export async function signInWithEmail(_email: string, _password: string): Promise<void> {
  await wait();
  throw appError("email_not_confirmed");
}

export async function resendConfirmation(_email: string): Promise<void> {
  await wait();
}

export async function requestPasswordReset(_email: string): Promise<void> {
  await wait();
}

export async function updatePassword(_password: string): Promise<void> {
  await wait();
}

export async function exchangeAuthCode(_code: string): Promise<void> {
  await wait();
}

export async function signOut(): Promise<void> {
  await wait();
}

export const googleSignInAvailable = true;

export async function signInWithGoogle(): Promise<void> {
  await wait();
}

/** The Apple button is iOS-only and native, so the web preview cannot draw it. */
export async function appleSignInAvailable(): Promise<boolean> {
  return false;
}

export async function signInWithApple(): Promise<void> {
  await wait();
}
