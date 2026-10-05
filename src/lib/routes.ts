/*
 * Every page of the site has its own path. "/" itself only redirects: members to the panel,
 * guests to the landing page.
 */
export const ROUTES = {
  landing: "/giris",
  login: "/giris-yap",
  register: "/kayit-ol",
  onboarding: "/baslangic",
  panel: "/panel",
  plan: "/plan",
  progress: "/gelisim",
  sources: "/kaynaklar",
} as const;

/** Query parameter that carries the page to return to after signing in or up. */
export const RETURN_PARAM = "sonra";

/** C0 control characters, space and DEL: browsers strip or reinterpret them inside URLs. */
const CONTROL_OR_SPACE = new RegExp("[\u0000-\u0020\u007f]");

/** Pages that make no sense to come back to after signing in. */
const NO_RETURN: readonly string[] = ["/", ROUTES.landing, ROUTES.login, ROUTES.register, ROUTES.onboarding];

/**
 * Where to go after signing in. Only same-site paths are accepted ("/x", not "//evil.com" or
 * "https://…"), so the parameter can't be used as an open redirect.
 */
export function safeReturnPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return ROUTES.panel;
  // Browsers drop tabs/newlines while parsing URLs ("/<TAB>/evil.com" -> "//evil.com"): no control
  // characters or whitespace, and the path must stay on this origin when resolved.
  if (CONTROL_OR_SPACE.test(value)) return ROUTES.panel;
  const base = "http://kalori.invalid";
  if (new URL(value, base).origin !== base) return ROUTES.panel;
  const path = value.split(/[?#]/)[0];
  return NO_RETURN.includes(path) ? ROUTES.panel : value;
}

/** The sign-in or sign-up page, remembering `from` (when worth returning to). */
export function authPath(view: "login" | "register", from?: string | null): string {
  const base = view === "login" ? ROUTES.login : ROUTES.register;
  const back = from ? safeReturnPath(from) : ROUTES.panel;
  return back === ROUTES.panel ? base : `${base}?${RETURN_PARAM}=${encodeURIComponent(back)}`;
}
