import { MAX_AI_TEXT } from "@calorie/core/schemas/ai";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import FormError from "@/components/auth/FormError";
import { formatGrams } from "@/components/meals/format";
import Button from "@/components/ui/Button";
import Screen from "@/components/ui/Screen";
import TextField from "@/components/ui/TextField";
import { useAiLog } from "@/hooks/useAiLog";
import { useAllowance } from "@/hooks/useAllowance";
import { useMealDraft } from "@/hooks/useMealDraft";
import { useTextPreview } from "@/hooks/useTextPreview";
import { colors, radius, space, type } from "@/theme";
import AllowanceLine from "./AllowanceLine";

function close() {
  if (router.canGoBack()) router.back();
  else router.replace("/today");
}

/**
 * Yazarak ekle (003 US2): the meal in Turkish, an instant preview from the food search, then
 * "Kontrol et" (preview only, no allowance) or "AI ile analiz et" (one AI log). Both end on the
 * review step, where every gram can be changed.
 */
export default function TextLogScreen() {
  const [text, setText] = useState("");
  const preview = useTextPreview(text);
  const ai = useAiLog();
  const allowance = useAllowance();
  const { fillFromAi } = useMealDraft();

  function check() {
    const unmatched = preview.lines.filter((l) => !l.food).map((l) => ({ description: l.phrase }));
    fillFromAi(preview.proposed, unmatched);
    router.replace("/log/review");
  }

  const empty = preview.lines.length === 0;
  const footer = (
    <View style={styles.footer}>
      {ai.error && <FormError message={ai.error.message} />}
      {ai.error && <Button label="Ara" variant="ghost" onPress={() => router.replace("/log/search")} />}
      <AllowanceLine line={allowance.line} />
      <Button label="Kontrol et" onPress={check} disabled={empty || ai.pending} />
      <Button
        label="AI ile analiz et"
        variant="secondary"
        loading={ai.pending}
        disabled={text.trim() === "" || !allowance.canAnalyse}
        onPress={() => ai.analyse({ kind: "text", text: text.trim() })}
        accessibilityHint="Bir AI hakkı kullanır"
      />
    </View>
  );

  return (
    <Screen title="Yazarak ekle" lead="Ne yediğini yaz; miktarı da yazarsan gramı ben hesaplarım." back={{ label: "Kapat", onPress: close, icon: "close" }} footer={footer}>
      <TextField
        label="Ne yedin?"
        value={text}
        onChangeText={setText}
        placeholder="ör. 2 yumurta, yarım simit, şekersiz çay"
        hint={`${text.length}/${MAX_AI_TEXT}`}
        multiline
        maxLength={MAX_AI_TEXT}
        autoFocus
      />
      {preview.lines.map((line, i) => (
        <View key={`${i}-${line.phrase}`} style={styles.line}>
          <Text style={styles.phrase}>{line.phrase}</Text>
          {line.food ? (
            <Text style={styles.match}>
              {line.food.name} · {formatGrams(line.grams ?? 0)} g{line.estimated ? " (tahmini)" : ""}
            </Text>
          ) : (
            <Text style={styles.miss}>{preview.offline ? "Bağlantı bekleniyor" : preview.searching ? "Aranıyor…" : "Bulunamadı"}</Text>
          )}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: { gap: space(2) },
  line: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: space(3), gap: space(1) },
  phrase: { ...type.small, color: colors.fgMuted },
  match: { ...type.bodyStrong, color: colors.fg },
  miss: { ...type.body, color: colors.fgMuted },
});
