import { isAuthError } from "@supabase/supabase-js";

/*
 * The Turkish text for every failure the UI shows (FR-022), and how anything Supabase returns maps
 * to it. Database functions raise stable codes (contracts/database-api.md); Supabase Auth errors
 * carry a `code`. Unknown auth codes get a generic message: the server's English text is never
 * shown. No React Native imports, so tests/errorMessages.test.ts runs this under node.
 */
export const MESSAGES = {
  network: "İnternet bağlantısı yok gibi görünüyor. Bağlantını kontrol edip tekrar dene.",
  not_configured: "Uygulamanın sunucu ayarları eksik. Geliştiriciye haber ver.",
  plan_below_floor: "Bu plan güvenli günlük kalori sınırının altında kalıyor.",
  plan_macros_mismatch: "Makrolar kaloriyle tutmuyor. Değerleri yeniden ayarla.",
  meal_not_found: "Bu öğün bulunamadı. Silinmiş olabilir.",
  unknown_food: "Bu yemek veritabanında bulunamadı.",
  invalid_credentials: "E-posta ya da şifre hatalı.",
  email_not_confirmed: "E-postanı henüz doğrulamadın. Gelen kutundaki bağlantıya dokun.",
  user_already_exists: "Bu e-postayla zaten bir hesap var. Giriş yapmayı dene.",
  weak_password: "Bu şifre kolay tahmin edilebilir. Daha uzun ya da farklı bir şifre seç.",
  same_password: "Yeni şifren eskisinden farklı olmalı.",
  email_address_invalid: "Bu e-posta adresi geçerli görünmüyor. Kontrol edip tekrar dene.",
  email_address_not_authorized: "Bu adrese şu anda e-posta gönderilemiyor. Geliştiriciye haber ver.",
  email_rate_limit: "Kısa sürede çok fazla e-posta istendi. Birkaç dakika sonra tekrar dene.",
  rate_limit: "Çok fazla deneme yapıldı. Biraz bekleyip tekrar dene.",
  link_invalid: "Bu bağlantının süresi dolmuş ya da bu cihazda açılamıyor. Uygulamadan yeni bir bağlantı iste.",
  session_expired: "Oturumun sona erdi. Tekrar giriş yap.",
  signup_disabled: "Şu anda yeni hesap açılamıyor. Daha sonra tekrar dene.",
  provider_disabled: "Bu giriş yöntemi şu anda kullanılamıyor. Başka bir yöntemle dene.",
  user_banned: "Bu hesap askıya alınmış.",
  identity_already_exists: "Bu giriş yöntemi başka bir hesaba bağlı.",
  google_unavailable: "Bu cihazda Google ile giriş yapılamıyor. E-postayla devam et.",
  auth_failed: "Giriş yapılamadı. Biraz sonra tekrar dene.",
  unexpected: "Bir şeyler ters gitti. Tekrar dene.",
} as const;

export type MessageCode = keyof typeof MESSAGES;

const DATABASE_CODES: MessageCode[] = ["plan_below_floor", "plan_macros_mismatch", "meal_not_found", "unknown_food"];

/** Supabase Auth error codes (https://supabase.com/docs/guides/auth/debugging/error-codes) → ours. */
const AUTH_CODES: Record<string, MessageCode> = {
  invalid_credentials: "invalid_credentials",
  email_not_confirmed: "email_not_confirmed",
  user_already_exists: "user_already_exists",
  email_exists: "user_already_exists",
  weak_password: "weak_password",
  same_password: "same_password",
  email_address_invalid: "email_address_invalid",
  email_address_not_authorized: "email_address_not_authorized",
  over_email_send_rate_limit: "email_rate_limit",
  over_request_rate_limit: "rate_limit",
  otp_expired: "link_invalid",
  flow_state_expired: "link_invalid",
  flow_state_not_found: "link_invalid",
  bad_code_verifier: "link_invalid",
  pkce_code_verifier_not_found: "link_invalid",
  session_not_found: "session_expired",
  session_expired: "session_expired",
  refresh_token_not_found: "session_expired",
  refresh_token_already_used: "session_expired",
  signup_disabled: "signup_disabled",
  provider_disabled: "provider_disabled",
  email_provider_disabled: "provider_disabled",
  oauth_provider_not_supported: "provider_disabled",
  user_banned: "user_banned",
  identity_already_exists: "identity_already_exists",
  request_timeout: "network",
};

/** Client-side auth errors without a server code. */
const AUTH_ERROR_NAMES: Record<string, MessageCode> = {
  AuthRetryableFetchError: "network",
  AuthSessionMissingError: "session_expired",
};

export function describeError(err: unknown): { code: MessageCode; message: string } {
  const code = codeOf(err);
  return { code, message: MESSAGES[code] };
}

function codeOf(err: unknown): MessageCode {
  if (isAuthError(err)) return AUTH_CODES[err.code ?? ""] ?? AUTH_ERROR_NAMES[err.name] ?? "auth_failed";
  const message = err instanceof Error ? err.message : typeof err === "object" && err && "message" in err ? String(err.message) : "";
  const code = DATABASE_CODES.find((c) => message.includes(c));
  if (code) return code;
  if (/network|fetch|timeout/i.test(message)) return "network";
  return "unexpected";
}
