import { router } from "expo-router";
import { StyleSheet, Text } from "react-native";
import FormError from "@/components/auth/FormError";
import Button from "@/components/ui/Button";
import Screen from "@/components/ui/Screen";
import TextField from "@/components/ui/TextField";
import { PASSWORD_MIN_LENGTH } from "@/hooks/authValidation";
import { useNewPasswordForm } from "@/hooks/useAuthForm";
import { useSession } from "@/hooks/useSession";
import { colors, type } from "@/theme";

/** The new password, reached from the reset e-mail's link (US1, FR-003). */
export default function ResetPassword() {
  const { status } = useSession();
  const form = useNewPasswordForm();

  if (status !== "recovery") {
    return (
      <Screen title="Yeni şifre">
        <Text style={styles.body}>
          Yeni şifreni, e-postana gelen sıfırlama bağlantısından belirleyebilirsin. Bağlantı istemek için giriş ekranında “Şifremi unuttum”a dokun.
        </Text>
        <Button label="Giriş ekranına git" variant="secondary" onPress={() => router.replace("/sign-in")} />
      </Screen>
    );
  }

  return (
    <Screen title="Yeni şifre" lead="Hesabın için yeni bir şifre belirle.">
      <TextField
        label="Yeni şifre"
        value={form.values.password}
        onChangeText={(text) => form.setField("password", text)}
        secureTextEntry
        autoComplete="new-password"
        autoFocus
        hint={`En az ${PASSWORD_MIN_LENGTH} karakter.`}
        error={form.errors.password}
      />
      {form.formError && <FormError message={form.formError.message} />}
      <Button label="Şifreyi kaydet" loading={form.pending} onPress={() => void form.submit()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { ...type.body, color: colors.fg },
});
