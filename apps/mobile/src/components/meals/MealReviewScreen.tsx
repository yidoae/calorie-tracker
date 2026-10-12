import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import FormError from "@/components/auth/FormError";
import Button from "@/components/ui/Button";
import Screen from "@/components/ui/Screen";
import StateMessage from "@/components/ui/StateMessage";
import { gramsError, MAX_DRAFT_ITEMS } from "@/hooks/mealLogic";
import { useLogMeal } from "@/hooks/useLogMeal";
import { colors, radius, space, type } from "@/theme";
import DraftItemCard from "./DraftItemCard";
import MacroLine from "./MacroLine";
import SlotPicker from "./SlotPicker";

function leave() {
  if (router.canGoBack()) router.back();
  else router.replace("/today");
}

/**
 * Kontrol et (US3, FR-013, FR-014): every food needs its grams typed before the meal can be saved;
 * calories and macros follow as the user types; the slot defaults from the time of day.
 */
export default function MealReviewScreen() {
  const meal = useLogMeal();

  async function onSave() {
    if (await meal.save()) leave();
  }

  function onCancel() {
    meal.cancel();
    leave();
  }

  if (meal.items.length === 0) {
    return (
      <Screen title="Kontrol et" back={{ label: "Geri", onPress: leave }}>
        <StateMessage
          kind="empty"
          title="Henüz yemek seçmedin"
          body="Önce yediğin yemeği ara."
          actionLabel="Yemek ara"
          onAction={() => router.replace("/log/search")}
        />
      </Screen>
    );
  }

  const footer = (
    <View style={styles.footer}>
      {meal.error && <FormError message={meal.error.message} />}
      <Button testID="meal-save" label="Kaydet" loading={meal.pending} onPress={() => void onSave()} />
      {meal.items.length < MAX_DRAFT_ITEMS && (
        <Button label="Yemek ekle" variant="secondary" onPress={() => router.push({ pathname: "/log/search", params: { adding: "1" } })} />
      )}
    </View>
  );

  return (
    <Screen title="Kontrol et" lead="Ne kadar yediğini gram olarak yaz." back={{ label: "Vazgeç, kaydetmeden çık", onPress: onCancel, icon: "close" }} footer={footer}>
      {meal.items.map((item) => (
        <DraftItemCard
          key={item.key}
          name={item.food.name}
          typicalPortionG={item.food.typicalPortionG}
          gramsText={item.gramsText}
          onChangeGrams={(text) => meal.setGrams(item.key, text)}
          macros={item.macros}
          error={meal.showErrors || item.gramsText.trim() !== "" ? gramsError(item.gramsText) : null}
          onRemove={() => meal.removeItem(item.key)}
        />
      ))}

      <View style={styles.section}>
        <Text style={styles.label}>Hangi öğün?</Text>
        <SlotPicker value={meal.slot} onChange={meal.setSlot} />
      </View>

      <View style={styles.total} accessibilityLiveRegion="polite">
        <Text style={styles.label}>Öğün toplamı</Text>
        <MacroLine macros={meal.totals} strong />
        {!meal.ready && <Text style={styles.note}>Gramını yazmadığın yemekler toplama girmez.</Text>}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: { gap: space(2) },
  section: { gap: space(2) },
  label: { ...type.label, color: colors.fgMuted },
  total: { backgroundColor: colors.surface2, borderRadius: radius.lg, padding: space(4), gap: space(1) },
  note: { ...type.small, color: colors.fgMuted },
});
