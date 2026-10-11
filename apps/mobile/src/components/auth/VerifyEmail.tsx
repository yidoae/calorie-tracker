import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import Button from "@/components/ui/Button";
import { useResendConfirmation } from "@/hooks/useAuthActions";
import { colors, space, type } from "@/theme";

interface Props {
  email: string;
  onEditEmail: () => void;
}

/** "E-postanı doğrula": after an e-mail sign-up, until the link in the e-mail is opened (FR-002). */
export default function VerifyEmail({ email, onEditEmail }: Props) {
  const resend = useResendConfirmation();
  return (
    <View style={styles.wrap}>
      <View style={styles.icon}>
        <Ionicons name="mail-unread-outline" size={28} color={colors.fg} />
      </View>
      <Text style={styles.body}>
        <Text style={styles.email}>{email}</Text> adresine bir doğrulama bağlantısı gönderdik. Bağlantıya bu telefondan dokun; uygulama açılır ve
        kuruluma geçersin.
      </Text>
      <Text style={styles.hint}>Birkaç dakika içinde gelmezse spam klasörüne bak. Yalnızca en son gönderilen bağlantı çalışır.</Text>
      <View style={styles.actions}>
        <Button label="E-postayı yeniden gönder" variant="secondary" loading={resend.isPending} onPress={() => resend.mutate(email)} />
        <Button label="E-posta adresini değiştir" variant="ghost" onPress={onEditEmail} />
        <Button label="Doğruladım, giriş yap" variant="ghost" onPress={() => router.replace("/sign-in")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space(3) },
  icon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surface2, alignItems: "center", justifyContent: "center" },
  body: { ...type.body, color: colors.fg },
  email: { ...type.bodyStrong },
  hint: { ...type.small, color: colors.fgMuted },
  actions: { gap: space(2), marginTop: space(2) },
});
