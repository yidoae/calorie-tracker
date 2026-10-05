"use client";

import { Eye, EyeOff, Loader2, Quote } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import type { AuthView } from "@/hooks/useAuth";
import { useAuthForm } from "@/hooks/useAuthForm";
import { authPath } from "@/lib/routes";
import MaskedWords from "../landing/MaskedWords";
import { LEGENDS } from "../landing/legends";
import SiteHeader from "../layout/SiteHeader";
import { SPRING, SPRING_SCENE } from "../ui/motion";

const COPY = {
  login: {
    eyebrow: "Giriş yap",
    headline: "Tekrar hoş geldin.",
    lead: "Kaldığın yerden devam et: bugünün halkaları seni bekliyor.",
    legendId: "lalanne",
    formTitle: "Hesabına giriş yap",
    formLead: "Kullanıcı adın ve şifrenle giriş yap.",
    submit: "Giriş Yap",
  },
  register: {
    eyebrow: "Kayıt ol",
    headline: "İlk adım burada.",
    lead: "Bir kullanıcı adı ve şifre yeter. Planını FitBot ile birlikte kuralım.",
    legendId: "kipchoge",
    formTitle: "Hesap oluştur",
    formLead: "Sadece bir kullanıcı adı ve şifre yeterli.",
    submit: "Kayıt Ol",
  },
} as const;

const TABS: { view: AuthView; label: string }[] = [
  { view: "login", label: "Giriş Yap" },
  { view: "register", label: "Kayıt Ol" },
];

interface Props {
  view: AuthView;
  /** Same-site path to open after signing in (already validated on the server). */
  returnTo: string;
}

/** /giris-yap and /kayit-ol: a headline with an athlete's words on the left, the form on a white panel on the right. */
export default function AuthScreen({ view, returnTo }: Props) {
  const copy = COPY[view];
  const legend = LEGENDS.find((l) => l.id === copy.legendId);

  return (
    <div className="flex flex-1 flex-col bg-ink text-on-ink">
      <SiteHeader />
      <main className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-10 px-4 pt-6 pb-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16 lg:pb-24">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, transition: SPRING_SCENE }}
            className="text-xs font-semibold tracking-[0.05em] text-cta uppercase"
          >
            {copy.eyebrow}
          </motion.p>
          <h1 className="mt-4 font-display text-5xl leading-[1.02] sm:text-7xl">
            <MaskedWords key={view} text={copy.headline} delay={0.05} />
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, transition: { ...SPRING_SCENE, delay: 0.35 } }}
            className="mt-6 max-w-lg text-base text-on-ink-muted sm:text-lg"
          >
            {copy.lead}
          </motion.p>
          {legend?.quote && (
            <motion.figure
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0, transition: { ...SPRING_SCENE, delay: 0.5 } }}
              className="mt-10 hidden max-w-lg border-l-4 border-cta pl-4 lg:block"
            >
              <Quote aria-hidden className="size-5 text-cta" />
              <blockquote className="mt-2 font-display text-xl leading-snug">&ldquo;{legend.quote.tr}&rdquo;</blockquote>
              <figcaption className="mt-2 text-xs text-on-ink-muted">
                {legend.name} · {legend.discipline}
              </figcaption>
            </motion.figure>
          )}
        </div>

        <motion.section
          aria-labelledby="auth-title"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0, transition: { ...SPRING_SCENE, delay: 0.2 } }}
          className="rounded-[24px] bg-surface p-6 text-fg sm:p-8"
        >
          <nav aria-label="Giriş veya kayıt" className="grid grid-cols-2 gap-1 rounded-[6px] border border-border-strong p-1">
            {TABS.map((tab) => {
              const active = tab.view === view;
              return (
                <Link
                  key={tab.view}
                  href={authPath(tab.view, returnTo)}
                  replace
                  aria-current={active ? "page" : undefined}
                  className={`relative flex h-9 items-center justify-center rounded-[4px] text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    active ? "text-on-ink" : "text-fg-muted hover:text-fg"
                  }`}
                >
                  {active && <motion.span layoutId="auth-tab" transition={SPRING} className="absolute inset-0 rounded-[4px] bg-ink" />}
                  <span className="relative">{tab.label}</span>
                </Link>
              );
            })}
          </nav>

          <h2 id="auth-title" className="mt-6 font-display text-2xl">
            {copy.formTitle}
          </h2>
          <p className="mt-1 text-[13px] text-fg-muted">{copy.formLead}</p>
          <AuthForm key={view} view={view} returnTo={returnTo} />
        </motion.section>
      </main>
    </div>
  );
}

function AuthForm({ view, returnTo }: Props) {
  const form = useAuthForm(view, returnTo);
  const register = view === "register";

  return (
    <form onSubmit={form.submit} className="mt-6 space-y-4" noValidate>
      <div>
        <label htmlFor="auth-username" className="label">
          Kullanıcı adı
        </label>
        <input
          id="auth-username"
          name="username"
          autoFocus
          required
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={24}
          value={form.username}
          onChange={(e) => form.setUsername(e.target.value)}
          aria-describedby={register ? "auth-username-hint" : undefined}
          className="input"
        />
        {register && (
          <p id="auth-username-hint" className="hint">
            3–24 karakter; harf, rakam, _ veya .
          </p>
        )}
      </div>

      <div>
        <label htmlFor="auth-password" className="label">
          Şifre
        </label>
        <div className="relative">
          <input
            id="auth-password"
            name="password"
            type={form.showPassword ? "text" : "password"}
            required
            autoComplete={register ? "new-password" : "current-password"}
            maxLength={128}
            value={form.password}
            onChange={(e) => form.setPassword(e.target.value)}
            aria-describedby={register ? "auth-password-hint" : undefined}
            className="input pr-12"
          />
          <button
            type="button"
            aria-label={form.showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
            aria-pressed={form.showPassword}
            onClick={form.toggleShowPassword}
            className="btn btn-ghost btn-icon-sm absolute top-1 right-1"
          >
            {form.showPassword ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
          </button>
        </div>
        {register && (
          <p id="auth-password-hint" className="hint">
            En az 8 karakter. Şifren güvenli şekilde şifrelenerek (argon2) saklanır; kimse göremez.
          </p>
        )}
      </div>

      {form.error && (
        <p role="alert" className="alert alert-danger">
          {form.error}
        </p>
      )}

      <button type="submit" disabled={!form.canSubmit} className="btn btn-primary btn-lg w-full">
        {form.pending && <Loader2 aria-hidden className="size-4 animate-spin" />}
        {COPY[view].submit}
      </button>
    </form>
  );
}
