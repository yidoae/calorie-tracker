import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import AccountSummary from "@/components/auth/AccountSummary";
import Button from "@/components/ui/Button";
import Screen from "@/components/ui/Screen";
import Sheet from "@/components/ui/Sheet";
import { useSignOut } from "@/hooks/useAuthActions";
import { useSession } from "@/hooks/useSession";
import { colors, type } from "@/theme";

/** Account, the food data credit (002 FR-015) and sign-out (US1, FR-005). */
export default function Profile() {
  const { session } = useSession();
  const { signOut, pending } = useSignOut();
  const [confirming, setConfirming] = useState(false);
  const user = session?.user;

  return (
    <Screen title="Profil" lead="Hesabın ve giriş yöntemlerin.">
      <AccountSummary email={user?.email ?? null} providers={user?.identities?.map((identity) => identity.provider) ?? []} />
      <Text style={styles.heading} accessibilityRole="header">
        VERİ KAYNAKLARI
      </Text>
      <Text style={styles.body}>
        Besin değerleri: USDA FoodData Central (kamu malı, CC0). Türk yemekleri USDA verileriyle tariflerden hesaplanır.
      </Text>
      <Button label="Çıkış yap" variant="secondary" onPress={() => setConfirming(true)} />
      <Sheet visible={confirming} title="Çıkış yapılsın mı?" onClose={() => setConfirming(false)}>
        <Text style={styles.body}>
          Bu telefondaki oturumun ve kayıtlı verilerin silinir. Hesabın ve öğünlerin sunucuda kalır; tekrar giriş yaptığında geri gelir.
        </Text>
        <Button label="Çıkış yap" loading={pending} onPress={() => void signOut()} />
        <Button label="Vazgeç" variant="ghost" onPress={() => setConfirming(false)} />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { ...type.label, color: colors.fgMuted },
  body: { ...type.body, color: colors.fgMuted },
});
