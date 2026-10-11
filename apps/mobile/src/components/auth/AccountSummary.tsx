import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, space, type } from "@/theme";

interface Props {
  email: string | null;
  /** Supabase identity providers of the account: "email", "google", "apple". */
  providers: string[];
}

const METHODS: Record<string, { label: string; icon: ComponentProps<typeof Ionicons>["name"] }> = {
  email: { label: "E-posta ve şifre", icon: "mail-outline" },
  google: { label: "Google", icon: "logo-google" },
  apple: { label: "Apple", icon: "logo-apple" },
};

/** The account's e-mail and the ways it can sign in (US1). */
export default function AccountSummary({ email, providers }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>E-POSTA</Text>
      <Text style={styles.value}>{email ?? "E-posta paylaşılmadı"}</Text>
      <Text style={[styles.label, styles.gap]}>GİRİŞ YÖNTEMLERİ</Text>
      {providers.map((provider) => (
        <View key={provider} style={styles.method}>
          <Ionicons name={METHODS[provider]?.icon ?? "key-outline"} size={18} color={colors.fg} />
          <Text style={styles.value}>{METHODS[provider]?.label ?? provider}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.lg, padding: space(4), gap: space(1.5) },
  label: { ...type.label, color: colors.fgMuted },
  gap: { marginTop: space(3) },
  value: { ...type.body, color: colors.fg },
  method: { flexDirection: "row", alignItems: "center", gap: space(2) },
});
