import { Linking, StyleSheet, Text, View } from "react-native";
import Button from "@/components/ui/Button";
import Sheet from "@/components/ui/Sheet";
import type { SensitiveWarning } from "@/hooks/planWizardLogic";
import { colors, space, type } from "@/theme";

const TEXT: Record<SensitiveWarning["kind"], { title: string; body: string; decline: string }> = {
  fasting: {
    title: "Aralıklı oruç herkese uygun değil",
    body: "Uzun açlık pencereleri yeme bozukluğu geçmişi olanlarda, hamilelik ve emzirme döneminde, diyabette ya da ilaç kullanırken sorun yaratabilir.",
    decline: "Bana göre değil, klasik düzende kal",
  },
  deficit: {
    title: "Büyük bir kalori açığı seçiyorsun",
    body: "Günde 750 kcal ve üzeri açık hızlı sonuç verebilir ama yorgunluk, kas kaybı ve yemekle ilgili zorlayıcı düşünce riskini artırır. Çoğu kişi için daha küçük bir açık daha sürdürülebilir.",
    decline: "Bana göre değil, daha küçük bir açık seç",
  },
};

interface Props {
  kind: SensitiveWarning["kind"];
  onAccept: () => void;
  onDecline: () => void;
}

/**
 * The notice's text and its two answers (FR-010). "Bana göre değil" comes first and keeps the
 * gentler option; it never blocks the user.
 */
export function SensitiveNoticeContent({ kind, onAccept, onDecline }: Props) {
  const text = TEXT[kind];
  return (
    <View style={styles.wrap}>
      <Text style={styles.body}>{text.body}</Text>
      <Text style={styles.body}>
        Yemekle ilişkin seni endişelendiriyorsa ya da yeme bozukluğu yaşadıysan, devam etmeden önce aile hekiminle, bir diyetisyenle ya da bir ruh sağlığı
        uzmanıyla konuş. Acil bir durumda <Text style={styles.strong}>112</Text>&apos;yi ara.
      </Text>
      <Text style={styles.body}>
        Yurt dışı kaynaklar:{" "}
        <Text accessibilityRole="link" style={styles.link} onPress={() => void Linking.openURL("https://www.beateatingdisorders.org.uk/")}>
          Beat
        </Text>{" "}
        ·{" "}
        <Text accessibilityRole="link" style={styles.link} onPress={() => void Linking.openURL("https://www.nationaleatingdisorders.org/")}>
          NEDA
        </Text>
      </Text>
      <View style={styles.actions}>
        <Button label={text.decline} variant="secondary" onPress={onDecline} />
        <Button label="Anladım, devam et" variant="ghost" onPress={onAccept} />
      </View>
    </View>
  );
}

/** Shown once, before 16:8 fasting or a deficit of 750 kcal or more; closing it keeps the gentler option. */
export default function SensitiveNotice({ warning, onAccept, onDecline }: { warning: SensitiveWarning | null; onAccept: () => void; onDecline: () => void }) {
  return (
    <Sheet visible={warning !== null} title={warning ? TEXT[warning.kind].title : ""} onClose={onDecline}>
      {warning && <SensitiveNoticeContent kind={warning.kind} onAccept={onAccept} onDecline={onDecline} />}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space(3) },
  body: { ...type.body, color: colors.fgMuted },
  strong: { fontWeight: "600", color: colors.fg },
  link: { color: colors.accent, textDecorationLine: "underline" },
  actions: { gap: space(1), marginTop: space(2) },
});
