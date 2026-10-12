import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import Screen from "@/components/ui/Screen";
import StateMessage from "@/components/ui/StateMessage";
import { useAuthLink } from "@/hooks/useAuthActions";
import { colors, space } from "@/theme";

interface Props {
  kind: "confirm" | "reset";
  /** The `code` query parameter of the deep link. */
  code: string | undefined;
}

const COPY = {
  confirm: { title: "E-postan doğrulanıyor", failed: "E-postan doğrulanamadı", after: " Adresini daha önce doğruladıysan giriş yapabilirsin." },
  reset: { title: "Bağlantı açılıyor", failed: "Bağlantı açılamadı", after: " Giriş ekranında “Şifremi unuttum”a dokunarak yeni bir bağlantı iste." },
} as const;

/**
 * Where kaloritakip://auth/confirm and kaloritakip://auth/reset land (T029). A confirmed address
 * signs the user in and the root layout moves on to setup; a reset link continues to the
 * new-password screen.
 */
export default function AuthLink({ kind, code }: Props) {
  const link = useAuthLink(code);

  useEffect(() => {
    if (kind === "reset" && link.isSuccess) router.replace("/reset-password");
  }, [kind, link.isSuccess]);

  if (link.isError) {
    return (
      <Screen title={COPY[kind].failed}>
        <StateMessage
          kind="error"
          title={COPY[kind].failed}
          body={link.error.message + COPY[kind].after}
          actionLabel="Giriş ekranına git"
          onAction={() => router.replace("/sign-in")}
        />
      </Screen>
    );
  }
  return (
    <Screen title={COPY[kind].title} lead="Bir saniye…">
      <View style={styles.wait}>
        <ActivityIndicator size="large" color={colors.fg} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wait: { paddingVertical: space(10), alignItems: "center" },
});
