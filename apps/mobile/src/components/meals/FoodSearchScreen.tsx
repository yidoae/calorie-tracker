import type { FoodHit } from "@calorie/core/schemas/rows";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import AllowanceLine from "@/components/ai/AllowanceLine";
import Button from "@/components/ui/Button";
import Screen from "@/components/ui/Screen";
import StateMessage from "@/components/ui/StateMessage";
import TextField from "@/components/ui/TextField";
import { useAllowance } from "@/hooks/useAllowance";
import { useFoodSearch } from "@/hooks/useFoodSearch";
import { useMealDraft } from "@/hooks/useMealDraft";
import { colors, space, type } from "@/theme";
import FoodHitRow from "./FoodHitRow";

interface Props {
  /** Opened from the review step to add another food: picking goes back there. */
  adding: boolean;
  /** An unmatched AI entry to replace with the picked food (003), and the text to start from. */
  resolve?: string;
  initialText?: string;
}

/** Yemek ara (US3, FR-012): results while typing; picking a food opens the gram review. */
export default function FoodSearchScreen({ adding, resolve, initialText = "" }: Props) {
  const [text, setText] = useState(initialText);
  const search = useFoodSearch(text);
  const { addFood, resolveUnmatched, clear } = useMealDraft();
  const allowance = useAllowance();

  // A new meal starts empty: a draft left by leaving the review with the back gesture is dropped.
  useEffect(() => {
    if (!adding) clear();
  }, [adding, clear]);

  function pick(hit: FoodHit) {
    if (resolve) resolveUnmatched(resolve, hit);
    else addFood(hit);
    if (adding) router.back();
    else router.replace("/log/review");
  }

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace("/today");
  }

  let results;
  if (search.idle) {
    results = <Text style={styles.hint}>En az iki harf yaz; sonuçlar yazdıkça gelir. “Tavuğu” da “tavuk” da olur.</Text>;
  } else if (search.error) {
    results = <StateMessage kind="error" title="Arama yapılamadı" body={search.error.message} actionLabel="Tekrar dene" onAction={search.retry} />;
  } else if (search.hits.length === 0 && search.searching) {
    results = <ActivityIndicator accessibilityLabel="Aranıyor" color={colors.fg} style={styles.loading} />;
  } else if (search.hits.length === 0) {
    results = <StateMessage kind="empty" title="Sonuç yok" body="Başka bir yazımla ya da daha kısa yazarak dene." />;
  } else {
    results = (
      <View accessibilityLabel={`${search.hits.length} sonuç`} style={styles.list}>
        {search.hits.map((hit) => (
          <FoodHitRow key={hit.foodId} hit={hit} onPress={() => pick(hit)} />
        ))}
      </View>
    );
  }

  return (
    <Screen title="Yemek ara" lead="Ne yediğini yaz, listeden seç." back={{ label: "Kapat", onPress: close, icon: "close" }}>
      {!adding && (
        <View style={styles.ai}>
          <View style={styles.aiButtons}>
            <View style={styles.aiButton}>
              <Button label="Yazarak" variant="secondary" onPress={() => router.push("/log/text")} />
            </View>
          </View>
          <AllowanceLine line={allowance.line} />
        </View>
      )}
      <TextField testID="food-search-input" label="Ne yedin?" value={text} onChangeText={setText} placeholder="ör. tavuk göğsü" autoFocus={adding} />
      {results}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hint: { ...type.body, color: colors.fgMuted },
  loading: { marginVertical: space(8) },
  list: { gap: space(2) },
  ai: { gap: space(2) },
  aiButtons: { flexDirection: "row", gap: space(2) },
  aiButton: { flex: 1 },
});
