import { useState } from "react";
import { requestPasswordReset, signInWithEmail, signUpWithEmail, updatePassword } from "@/services/authService";
import { toAppError, type AppError } from "@/services/errors";
import { emailError, normalizeEmail, passwordError } from "./authValidation";
import { useToast } from "./useToast";

type Field = "email" | "password";

interface Options {
  /** The fields this form shows; only these are validated. */
  fields: Field[];
  /** True where the user chooses a password (sign-up, new password): it must meet the minimum length. */
  newPassword?: boolean;
  /** Runs with the normalized values once every field is valid; a throw becomes `formError`. */
  onSubmit: (values: Record<Field, string>) => Promise<void>;
}

/** State for the e-mail account forms (US1): values, field errors, one pending submit, a Turkish form error. */
function useAuthForm({ fields, newPassword = false, onSubmit }: Options) {
  const [values, setValues] = useState<Record<Field, string>>({ email: "", password: "" });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState<AppError | null>(null);
  const [pending, setPending] = useState(false);

  function setField(field: Field, text: string) {
    setValues((v) => ({ ...v, [field]: text }));
    setErrors((e) => ({ ...e, [field]: undefined }));
    setFormError(null);
  }

  async function submit() {
    if (pending) return;
    const next: Partial<Record<Field, string>> = {};
    if (fields.includes("email")) next.email = emailError(values.email) ?? undefined;
    if (fields.includes("password")) next.password = passwordError(values.password, { isNew: newPassword }) ?? undefined;
    setErrors(next);
    if (next.email || next.password) return;

    setPending(true);
    setFormError(null);
    try {
      await onSubmit({ email: normalizeEmail(values.email), password: values.password });
    } catch (err) {
      setFormError(toAppError(err));
    } finally {
      setPending(false);
    }
  }

  return { values, errors, formError, pending, setField, submit };
}

/** Sign-in with e-mail; on success the session moves the user on. */
export function useSignInForm() {
  return useAuthForm({ fields: ["email", "password"], onSubmit: ({ email, password }) => signInWithEmail(email, password) });
}

/** Sign-up with e-mail; `sentTo` is set when a confirmation e-mail went out (FR-002). */
export function useSignUpForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useAuthForm({
    fields: ["email", "password"],
    newPassword: true,
    onSubmit: async ({ email, password }) => {
      if (await signUpWithEmail(email, password)) setSentTo(email);
    },
  });
  return { ...form, sentTo, editEmail: () => setSentTo(null) };
}

/** "Şifremi unuttum": sends the reset link, then calls `onSent`. */
export function usePasswordResetForm(onSent: () => void) {
  const toast = useToast();
  return useAuthForm({
    fields: ["email"],
    onSubmit: async ({ email }) => {
      await requestPasswordReset(email);
      toast.show("success", "Bağlantı gönderildi", `Bu adrese kayıtlı bir hesap varsa ${email} adresine şifre sıfırlama bağlantısı gelecek.`);
      onSent();
    },
  });
}

/** The new password after a reset link; saving it ends the recovery state and opens the app. */
export function useNewPasswordForm() {
  const toast = useToast();
  return useAuthForm({
    fields: ["password"],
    newPassword: true,
    onSubmit: async ({ password }) => {
      await updatePassword(password);
      toast.show("success", "Şifren güncellendi", "Bundan sonra yeni şifrenle giriş yap.");
    },
  });
}
