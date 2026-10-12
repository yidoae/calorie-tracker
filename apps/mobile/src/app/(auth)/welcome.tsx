import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SocialButtons from "@/components/auth/SocialButtons";
import Button from "@/components/ui/Button";
import { colors, radius, space, type } from "@/theme";

/** Signed-out landing (US1): Apple (iOS), Google and e-mail. */
export default function Welcome() {
  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <View style={styles.brand}>
        <Text style={styles.eyebrow}>KALORİ TAKİP</Text>
        <Text accessibilityRole="header" style={styles.title}>
          Öğününü kaydet, hedefini takip et.
        </Text>
        <Text style={styles.lead}>Fotoğraf, barkod ya da yemeğin adıyla saniyeler içinde.</Text>
      </View>
      <SafeAreaView edges={["bottom"]} style={styles.panel}>
        <SocialButtons />
        <Button testID="welcome-email" label="E-postayla devam et" onPress={() => router.push("/sign-up")} />
        <Button label="Zaten hesabın var mı? Giriş yap" variant="ghost" onPress={() => router.push("/sign-in")} />
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  brand: { flex: 1, gap: space(3), paddingHorizontal: space(6), justifyContent: "center" },
  eyebrow: { ...type.label, color: colors.cta },
  title: { ...type.displayXl, color: colors.onInk },
  lead: { ...type.body, color: colors.onInkMuted },
  panel: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.panel,
    borderTopRightRadius: radius.panel,
    paddingHorizontal: space(5),
    paddingTop: space(6),
    paddingBottom: space(4),
    gap: space(3),
  },
});
