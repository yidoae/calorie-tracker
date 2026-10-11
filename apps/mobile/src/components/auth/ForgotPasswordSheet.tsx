import { StyleSheet, Text } from "react-native";
import Button from "@/components/ui/Button";
import Sheet from "@/components/ui/Sheet";
import TextField from "@/components/ui/TextField";
import { usePasswordResetForm } from "@/hooks/useAuthForm";
import { colors, type } from "@/theme";
import FormError from "./FormError";

interface Props {
  visible: boolean;
  onClose: () => void;
}

/** "Şifremi unuttum": asks for the address and sends the reset link (FR-003). */
export default function ForgotPasswordSheet({ visible, onClose }: Props) {
  const form = usePasswordResetForm(onClose);
  return (
    <Sheet visible={visible} title="Şifreni sıfırla" onClose={onClose}>
      <Text style={styles.lead}>Hesabının e-posta adresini yaz; yeni şifre belirlemen için bir bağlantı gönderelim.</Text>
      <TextField
        label="E-posta"
        value={form.values.email}
        onChangeText={(text) => form.setField("email", text)}
        placeholder="ad@ornek.com"
        keyboardType="email-address"
        autoComplete="email"
        error={form.errors.email}
      />
      {form.formError && <FormError message={form.formError.message} />}
      <Button label="Bağlantı gönder" loading={form.pending} onPress={() => void form.submit()} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  lead: { ...type.body, color: colors.fgMuted },
});
