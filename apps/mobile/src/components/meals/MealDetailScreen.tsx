import { SLOT_LABELS } from "@calorie/core/labels";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import FormError from "@/components/auth/FormError";
import Button from "@/components/ui/Button";
import Screen from "@/components/ui/Screen";
import Sheet from "@/components/ui/Sheet";
import StateMessage from "@/components/ui/StateMessage";
import { useMealDetail } from "@/hooks/useMealDetail";
import { useToast } from "@/hooks/useToast";
import { colors, radius, space, type } from "@/theme";
import GramsSheet from "./GramsSheet";
import MacroLine from "./MacroLine";
import MealItemRow from "./MealItemRow";

function leave() {
  if (router.canGoBack()) router.back();
  else router.replace("/today");
}

/** Öğün (US3, FR-017): the meal's items; change an item's grams, remove an item, delete the meal. */
export default function MealDetailScreen({ mealId }: { mealId: string }) {
  const detail = useMealDetail(mealId);
  const toast = useToast();
  const [editing, setEditing] = useState<{ id: string; name: string; grams: number } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const back = { label: "Geri", onPress: leave };

  if (detail.loading) {
    return (
      <Screen title="Öğün" back={back}>
        <ActivityIndicator accessibilityLabel="Öğün yükleniyor" color={colors.fg} style={styles.loading} />
      </Screen>
    );
  }
  if (detail.loadError) {
    return (
      <Screen title="Öğün" back={back}>
        <StateMessage kind="error" title="Öğün yüklenemedi" body={detail.loadError.message} actionLabel="Tekrar dene" onAction={detail.retry} />
      </Screen>
    );
  }
  const meal = detail.meal;
  if (!meal) {
    return (
      <Screen title="Öğün" back={back}>
        <StateMessage kind="empty" title="Bu öğün bulunamadı" body="Silinmiş olabilir." actionLabel="Bugüne dön" onAction={leave} />
      </Screen>
    );
  }

  async function saveGrams(text: string) {
    if (!editing) return;
    if (await detail.changeGrams(editing.id, text)) {
      setEditing(null);
      toast.show("success", "Gram güncellendi");
    }
  }

  async function remove(itemId: string) {
    if (await detail.removeItem(itemId)) toast.show("success", "Yemek öğünden çıkarıldı");
  }

  async function deleteMeal() {
    if (await detail.deleteMeal()) {
      setConfirmDelete(false);
      toast.show("success", "Öğün silindi");
      leave();
    }
  }

  const footer = <Button label="Öğünü sil" variant="secondary" onPress={() => setConfirmDelete(true)} />;

  return (
    <Screen title={SLOT_LABELS[meal.slot]} lead={meal.name} back={back} footer={footer}>
      {detail.error && !editing && !confirmDelete && <FormError message={detail.error.message} />}

      {detail.items.length === 0 ? (
        <StateMessage
          kind="empty"
          title="Bu öğünde yemek kalmadı"
          body="Boş öğünü silebilirsin."
          actionLabel="Öğünü sil"
          onAction={() => setConfirmDelete(true)}
        />
      ) : (
        <>
          <View style={styles.total}>
            <Text style={styles.label}>Öğün toplamı</Text>
            <MacroLine macros={meal.totals} strong />
          </View>
          {detail.items.map((item) => (
            <MealItemRow
              key={item.id}
              name={item.name}
              grams={item.grams}
              macros={item.macros}
              disabled={detail.pending}
              onEdit={() => {
                detail.resetError();
                setEditing({ id: item.id, name: item.name, grams: item.grams });
              }}
              onRemove={() => void remove(item.id)}
            />
          ))}
        </>
      )}

      <GramsSheet
        item={editing}
        pending={detail.pending}
        error={detail.error?.message ?? null}
        onSave={(text) => void saveGrams(text)}
        onClose={() => {
          setEditing(null);
          detail.resetError();
        }}
      />
      <Sheet visible={confirmDelete} title="Öğün silinsin mi?" onClose={() => setConfirmDelete(false)}>
        <Text style={styles.body}>Bu öğün ve içindeki yemekler silinir; günün toplamı buna göre güncellenir.</Text>
        {detail.error && <FormError message={detail.error.message} />}
        <Button label="Öğünü sil" loading={detail.pending} onPress={() => void deleteMeal()} />
        <Button label="Vazgeç" variant="ghost" onPress={() => setConfirmDelete(false)} />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginVertical: space(10) },
  total: { backgroundColor: colors.surface2, borderRadius: radius.lg, padding: space(4), gap: space(1) },
  label: { ...type.label, color: colors.fgMuted },
  body: { ...type.body, color: colors.fgMuted },
});
