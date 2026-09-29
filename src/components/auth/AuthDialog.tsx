"use client";

import { Eye, EyeOff, Loader2, LockKeyhole, X } from "lucide-react";
import { useId } from "react";
import { useAuth, type AuthView } from "@/hooks/useAuth";
import { useAuthForm } from "@/hooks/useAuthForm";
import Dialog from "../ui/Dialog";
import Segmented, { type SegmentedItem } from "../ui/Segmented";

type FormView = Exclude<AuthView, "guard">;

const FORM_TABS: SegmentedItem<FormView>[] = [
  { id: "login", label: "Giriş Yap" },
  { id: "register", label: "Kayıt Ol" },
];

/** The guard panel ("Üyelik bulunamadı…") and the sign-in / sign-up forms, in one dialog. */
export default function AuthDialog() {
  // switchAuthView keeps the pending action, so a visitor stopped mid-flow continues after signing in.
  const { dialog, switchAuthView, closeAuth } = useAuth();
  const titleId = useId();
  const descId = useId();

  return (
    <Dialog open={dialog !== null} onClose={closeAuth} labelledBy={titleId} describedBy={descId} className="max-w-[400px]">
      <div className="relative p-6">
        <button type="button" aria-label="Kapat" onClick={closeAuth} className="btn btn-ghost btn-icon-sm absolute top-4 right-4">
          <X aria-hidden className="size-4" />
        </button>
        {dialog === "guard" ? (
          <GuardPanel titleId={titleId} descId={descId} onChoose={switchAuthView} onClose={closeAuth} />
        ) : dialog ? (
          <AuthForm key={dialog} view={dialog} titleId={titleId} descId={descId} onViewChange={switchAuthView} />
        ) : null}
      </div>
    </Dialog>
  );
}

function GuardPanel({ titleId, descId, onChoose, onClose }: { titleId: string; descId: string; onChoose: (view: FormView) => void; onClose: () => void }) {
  return (
    <div className="text-center">
      <div aria-hidden className="mx-auto flex size-12 items-center justify-center rounded-[10px] bg-ink text-cta">
        <LockKeyhole className="size-6" />
      </div>
      <h2 id={titleId} className="mt-4 font-display text-2xl text-fg">
        Üyelik bulunamadı.
        <br />
        Üye olmak ister misiniz?
      </h2>
      <p id={descId} className="mx-auto mt-2 max-w-[288px] text-[13px] text-fg-muted">
        Öğün fotoğrafı yüklemek, kalori hesaplamak ve beslenme planı kaydetmek için ücretsiz bir hesap açın. Kaldığınız yerden devam edeceksiniz.
      </p>
      <div className="mt-6 flex flex-col gap-2">
        <button type="button" data-autofocus onClick={() => onChoose("register")} className="btn btn-primary btn-lg w-full">
          Üye ol
        </button>
        <button type="button" onClick={() => onChoose("login")} className="btn btn-secondary btn-lg w-full">
          Zaten üyeyim, giriş yap
        </button>
        <button type="button" onClick={onClose} className="btn btn-ghost w-full">
          Şimdi değil
        </button>
      </div>
    </div>
  );
}

function AuthForm({ view, titleId, descId, onViewChange }: { view: FormView; titleId: string; descId: string; onViewChange: (view: FormView) => void }) {
  const form = useAuthForm(view);
  const register = view === "register";

  return (
    <div>
      <h2 id={titleId} className="pr-8 font-display text-2xl text-fg">
        {register ? "Hesap oluştur" : "Tekrar hoş geldin"}
      </h2>
      <p id={descId} className="mt-1 text-[13px] text-fg-muted">
        {register ? "Sadece bir kullanıcı adı ve şifre yeterli." : "Kullanıcı adın ve şifrenle giriş yap."}
      </p>

      <Segmented items={FORM_TABS} value={view} onChange={onViewChange} label="Giriş veya kayıt" idPrefix="auth" className="mt-4" />

      <form id={`auth-${view}`} role="tabpanel" aria-labelledby={`auth-tab-${view}`} onSubmit={form.submit} className="mt-4 space-y-4" noValidate>
        <div>
          <label htmlFor="auth-username" className="label">
            Kullanıcı adı
          </label>
          <input
            id="auth-username"
            name="username"
            autoFocus
            data-autofocus
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
          {register ? "Kayıt Ol" : "Giriş Yap"}
        </button>
      </form>
    </div>
  );
}
