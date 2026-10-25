import { useState } from "react";
import FormError from "@/components/auth/FormError";
import Button from "@/components/ui/Button";
import Sheet from "@/components/ui/Sheet";
import TextField from "@/components/ui/TextField";
import { GRAM_STEP, stepGrams } from "./gramStep";
import { gramsError } from "@/hooks/mealLogic";

interface Props {
  /** The item being edited; the sheet is closed when null. */
  item: { name: string; grams: number } | null;
  pending: boolean;
  /** Why the last save failed. */
  error: string | null;
  onSave: (text: string) => void;
  onClose: () => void;
}

/** Changes one item's grams (FR-017); the same 0 < g ≤ 5000 rule as the review step. */
export default function GramsSheet({ item, pending, error, onSave, onClose }: Props) {
  return (
    <Sheet visible={item !== null} title={item ? `${item.name}: gram` : ""} onClose={onClose}>
      {/* Remounted per item, so the field starts from that item's grams. */}
      {item && <GramsForm key={item.name + item.grams} grams={item.grams} pending={pending} onSave={onSave} onClose={onClose} />}
      {item && error && <FormError message={error} />}
    </Sheet>
  );
}

function GramsForm({ grams, pending, onSave, onClose }: { grams: number; pending: boolean; onSave: (text: string) => void; onClose: () => void }) {
  const [text, setText] = useState(String(grams).replace(".", ","));
  const [tried, setTried] = useState(false);
  const error = tried || text.trim() !== "" ? gramsError(text) : null;

  function save() {
    setTried(true);
    if (gramsError(text) === null) onSave(text);
  }

  return (
    <>
      <TextField label="Kaç gram yedin?" value={text} onChangeText={setText} unit="g" keyboardType="decimal-pad" error={error} autoFocus stepper={{ onStep: (d) => setText(stepGrams(text, d)), ...GRAM_STEP }} />
      <Button label="Kaydet" loading={pending} onPress={save} />
      <Button label="Vazgeç" variant="ghost" onPress={onClose} />
    </>
  );
}
