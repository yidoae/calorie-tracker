import { router } from "expo-router";
import FormError from "@/components/auth/FormError";
import VerifyEmail from "@/components/auth/VerifyEmail";
import Button from "@/components/ui/Button";
import Screen from "@/components/ui/Screen";
import TextField from "@/components/ui/TextField";
import { PASSWORD_MIN_LENGTH } from "@/hooks/authValidation";
import { useSignUpForm } from "@/hooks/useAuthForm";

/** E-mail sign-up, then "E-postanı doğrula" until the link is opened (US1, FR-001, FR-002). */
export default function SignUp() {
  const form = useSignUpForm();

  if (form.sentTo) {
    return (
      <Screen title="E-postanı doğrula" lead="Hesabını açmak için son bir adım.">
        <VerifyEmail email={form.sentTo} onEditEmail={form.editEmail} />
      </Screen>
    );
  }

  return (
    <Screen title="Hesap oluştur" lead="E-postan ve bir şifreyle başla.">
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
        autoComplete="new-password"
        hint={`En az ${PASSWORD_MIN_LENGTH} karakter.`}
        error={form.errors.password}
      />
      {form.formError && <FormError message={form.formError.message} />}
      <Button label="Hesap oluştur" loading={form.pending} onPress={() => void form.submit()} />
      <Button label="Zaten hesabın var mı? Giriş yap" variant="ghost" onPress={() => router.replace("/sign-in")} />
    </Screen>
  );
}
