/*
 * Field rules for the account forms (US1). Pure, so tests/authValidation.test.ts runs it under node.
 * The server enforces the same minimum password length (supabase/README.md, Auth settings).
 */
export const PASSWORD_MIN_LENGTH = 8;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Supabase stores e-mails in lower case; `toLowerCase` is locale-free, so "I" becomes "i", never "ı". */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function emailError(raw: string): string | null {
  const email = normalizeEmail(raw);
  if (!email) return "E-posta adresini yaz.";
  if (!EMAIL.test(email)) return "Geçerli bir e-posta adresi yaz (ör. ad@ornek.com).";
  return null;
}

/** New passwords need the minimum length; signing in only needs something typed. */
export function passwordError(password: string, { isNew }: { isNew: boolean }): string | null {
  if (!password) return isNew ? "Bir şifre belirle." : "Şifreni yaz.";
  if (isNew && [...password].length < PASSWORD_MIN_LENGTH) return `Şifren en az ${PASSWORD_MIN_LENGTH} karakter olmalı.`;
  return null;
}
