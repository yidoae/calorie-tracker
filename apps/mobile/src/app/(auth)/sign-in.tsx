import { router } from "expo-router";
import { useState } from "react";
import FormError from "@/components/auth/FormError";
import ForgotPasswordSheet from "@/components/auth/ForgotPasswordSheet";
import Button from "@/components/ui/Button";
import Screen from "@/components/ui/Screen";
import TextField from "@/components/ui/TextField";
import { normalizeEmail } from "@/hooks/authValidation";
import { useResendConfirmation } from "@/hooks/useAuthActions";
import { useSignInForm } from "@/hooks/useAuthForm";

/** E-mail sign-in with "Şifremi unuttum" (US1, FR-001, FR-003). */
export default function SignIn() {
  const form = useSignInForm();
  const resend = useResendConfirmation();
  const [forgotOpen, setForgotOpen] = useState(false);
  const unconfirmed = form.formError?.code === "email_not_confirmed";

  return (
    <Screen title="Giriş yap" lead="E-postan ve şifrenle devam et.">
      <TextField
        label="E-posta"
        value={form.values.email}
        onChangeText={(text) => form.setField("email", text)}
        placeholder="ad@ornek.com"
        keyboardType="email-address"
        autoComplete="email"
        error={form.errors.email}
      />
      <TextField
        label="Şifre"
        value={form.values.password}
        onChangeText={(text) => form.setField("password", text)}
        secureTextEntry
        autoComplete="password"
        error={form.errors.password}
      />
      {form.formError && (
        <FormError
          message={form.formError.message}
          actionLabel={unconfirmed ? "Doğrulama e-postasını yeniden gönder" : undefined}
          actionPending={resend.isPending}
          onAction={() => resend.mutate(normalizeEmail(form.values.email))}
        />
      )}
      <Button label="Giriş yap" loading={form.pending} onPress={() => void form.submit()} />
      <Button label="Şifremi unuttum" variant="ghost" onPress={() => setForgotOpen(true)} />
      <Button label="Hesabın yok mu? Hesap oluştur" variant="ghost" onPress={() => router.replace("/sign-up")} />
      <ForgotPasswordSheet visible={forgotOpen} onClose={() => setForgotOpen(false)} />
    </Screen>
  );
}
