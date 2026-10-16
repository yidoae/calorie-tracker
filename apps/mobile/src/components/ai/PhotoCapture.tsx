import { router } from "expo-router";
import { Image, StyleSheet, Text, View } from "react-native";
import FormError from "@/components/auth/FormError";
import Button from "@/components/ui/Button";
import Screen from "@/components/ui/Screen";
import StateMessage from "@/components/ui/StateMessage";
import { useAiLog } from "@/hooks/useAiLog";
import { useAllowance } from "@/hooks/useAllowance";
import { usePhoto } from "@/hooks/usePhoto";
import { colors, radius, space, type } from "@/theme";
import AllowanceLine from "./AllowanceLine";

function close() {
  if (router.canGoBack()) router.back();
  else router.replace("/today");
}

/**
 * Fotoğrafla (003 US1, contracts/screens.md): take or pick one photo, see it, analyse it (one AI
 * log) and land on the review step. When nothing is found or the AI is down, typing and search are
 * one tap away (FR-016).
 */
export default function PhotoCapture() {
  const camera = usePhoto();
  const ai = useAiLog();
  const allowance = useAllowance();

  const fallback = (
    <View style={styles.row}>
      <View style={styles.cell}>
        <Button label="Yazarak ekle" variant="secondary" onPress={() => router.replace("/log/text")} />
      </View>
      <View style={styles.cell}>
        <Button label="Ara" variant="secondary" onPress={() => router.replace("/log/search")} />
      </View>
    </View>
  );

  const footer = camera.photo ? (
    <View style={styles.footer}>
      {ai.error && <FormError message={ai.error.message} />}
      {ai.error && fallback}
      <AllowanceLine line={allowance.line} />
      <Button label="Analiz et" loading={ai.pending} disabled={!allowance.canAnalyse} onPress={() => camera.photo && ai.analyse({ kind: "photo", image: camera.photo.base64 })} accessibilityHint="Bir AI hakkı kullanır" />
      {ai.pending ? (
        <Button label="Vazgeç" variant="ghost" onPress={ai.cancel} />
      ) : (
        <Button label="Yeniden çek" variant="secondary" onPress={() => void camera.choose("camera")} />
      )}
    </View>
  ) : (
    <View style={styles.footer}>
      <AllowanceLine line={allowance.line} />
      <Button label="Fotoğraf çek" onPress={() => void camera.choose("camera")} />
      <Button label="Galeriden seç" variant="secondary" onPress={() => void camera.choose("library")} />
    </View>
  );

  return (
    <Screen title="Fotoğrafla" lead="Tabağını yukarıdan çek; yiyecekleri ve gramlarını ben önereyim, sen kontrol et." back={{ label: "Kapat", onPress: close, icon: "close" }} footer={footer}>
      {camera.denied && (
        <StateMessage
          kind="error"
          title={camera.denied === "camera" ? "Kameraya izin yok" : "Fotoğraflara izin yok"}
          body="Ayarlar → Kalori Takip bölümünden izin verebilirsin. O zamana kadar yazarak ya da arayarak ekleyebilirsin."
        />
      )}
      {camera.photo ? (
        <Image source={{ uri: camera.photo.uri }} style={styles.photo} accessibilityLabel="Çektiğin fotoğraf" resizeMode="cover" />
      ) : (
        <Text style={styles.hint}>Fotoğraf yalnız analiz için gönderilir ve saklanmaz.</Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: { gap: space(2) },
  row: { flexDirection: "row", gap: space(2) },
  cell: { flex: 1 },
  photo: { width: "100%", aspectRatio: 4 / 3, borderRadius: radius.lg, backgroundColor: colors.surface2 },
  hint: { ...type.body, color: colors.fgMuted },
});
