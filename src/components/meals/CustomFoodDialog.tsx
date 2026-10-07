"use client";

import { Check, CircleCheck, Loader2, ScanText, TriangleAlert } from "lucide-react";
import { useId, useRef } from "react";
import { useCustomFoodForm, type LabelBasis } from "@/hooks/useCustomFoodForm";
import { SLOT_LABELS } from "@/lib/labels";
import type { LabelField } from "@/lib/nutrition/labelParse";
import type { CustomFood } from "@/types/food";
import type { MealSlot } from "@/types/meal";
import ChipGroup from "../ui/ChipGroup";
import Dialog from "../ui/Dialog";

interface Props {
  open: boolean;
  /** What the user searched for; pre-fills the name. */
  initialName: string;
  slot: MealSlot;
  onClose: () => void;
  onSaved: (food: CustomFood) => void;
}

const BASIS_OPTIONS: { id: LabelBasis; label: string }[] = [
  { id: "per100g", label: "100 g başına" },
  { id: "perServing", label: "1 porsiyon başına" },
];

const MAIN: { key: LabelField; label: string; unit: string }[] = [
  { key: "calories", label: "Enerji", unit: "kcal" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "carbs", label: "Karbonhidrat", unit: "g" },
  { key: "fat", label: "Yağ", unit: "g" },
];

const DETAILS: { key: LabelField; label: string; unit: string }[] = [
  { key: "satFat", label: "Doymuş yağ", unit: "g" },
  { key: "sugar", label: "Şeker", unit: "g" },
  { key: "fiber", label: "Lif", unit: "g" },
  { key: "sodium", label: "Sodyum", unit: "mg" },
];

/**
 * "Kendi ürününü ekle": a food that isn't in the list, typed in from the pack's nutrition table or
 * read from a photo of it. Saved to the user's foods and logged with the grams they ate.
 */
export default function CustomFoodDialog({ open, initialName, slot, onClose, onSaved }: Props) {
  const titleId = useId();
  return (
    <Dialog open={open} onClose={onClose} labelledBy={titleId} className="max-w-lg">
      {open && <Body titleId={titleId} initialName={initialName} slot={slot} onClose={onClose} onSaved={onSaved} />}
    </Dialog>
  );
}

function Body({ titleId, initialName, slot, onClose, onSaved }: Omit<Props, "open"> & { titleId: string }) {
  const form = useCustomFoodForm({ initialName, slot, onSaved });
  const fileRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const reading = form.label.kind === "reading";

  const numberField = ({ key, label, unit }: { key: LabelField; label: string; unit: string }, required: boolean) => (
    <div key={key}>
      <label htmlFor={`${id}-${key}`} className="label">
        {label} <span className="font-normal text-fg-subtle">({unit})</span>
        {required && <span className="sr-only"> (zorunlu)</span>}
      </label>
      <input
        id={`${id}-${key}`}
        value={form.fields[key]}
        onChange={(e) => form.set(key, e.target.value)}
        inputMode="decimal"
        autoComplete="off"
        placeholder={required ? "Zorunlu" : "İsteğe bağlı"}
        aria-invalid={form.isMissing(key) && required}
        className={`input ${form.isMissing(key) ? "border-warning-text ring-4 ring-warning-soft" : ""}`}
      />
    </div>
  );

  return (
    <form onSubmit={form.submit} className="max-h-[88vh] space-y-5 overflow-y-auto p-4 sm:p-6" noValidate>
      <div>
        <h2 id={titleId} className="font-display text-lg">
          Kendi ürününü ekle
        </h2>
        <p className="mt-1 text-[13px] text-fg-muted">
          Paketteki besin tablosunu gir ya da fotoğrafını çek. Ürün listene kaydedilir ve {SLOT_LABELS[slot]} öğününe eklenir.
        </p>
      </div>

      <div className="space-y-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.currentTarget.files?.[0];
            e.currentTarget.value = "";
            if (file) form.readLabel(file);
          }}
        />
        <button type="button" disabled={reading || form.saving} onClick={() => fileRef.current?.click()} className="btn btn-soft btn-lg w-full">
          {reading ? <Loader2 aria-hidden className="size-[18px] animate-spin" /> : <ScanText aria-hidden className="size-[18px]" />}
          {reading ? "Etiket okunuyor…" : "Besin tablosunun fotoğrafını çek"}
        </button>
        <div aria-live="polite">
          {reading && <p className="hint">Tablo düz ve net görünsün. İlk okumada dil verisi indirildiği için 10–20 sn sürebilir.</p>}
          {form.label.kind === "read" &&
            (form.label.missing.length === 0 ? (
              <p className="flex items-start gap-2 text-[13px] text-success-text">
                <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0" />
                Tablodaki tüm değerler okundu. Kaydetmeden önce paketle karşılaştır.
              </p>
            ) : (
              <p className="alert alert-warning">
                <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
                {form.label.missing.length} değer okunamadı; işaretli alanları paketten bakarak doldur. Okunanları da kontrol et.
              </p>
            ))}
          {form.label.kind === "failed" && (
            <p className="alert alert-warning">
              <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
              {form.label.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div>
          <label htmlFor={`${id}-name`} className="label">
            Ürün adı
          </label>
          <input
            id={`${id}-name`}
            data-autofocus
            value={form.fields.name}
            onChange={(e) => form.set("name", e.target.value)}
            placeholder="örn. Protein bar kakaolu"
            autoComplete="off"
            className="input"
          />
        </div>
        <div>
          <label htmlFor={`${id}-brand`} className="label">
            Marka <span className="font-normal text-fg-subtle">(isteğe bağlı)</span>
          </label>
          <input id={`${id}-brand`} value={form.fields.brand} onChange={(e) => form.set("brand", e.target.value)} autoComplete="off" className="input" />
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="label">Tablodaki değerler</legend>
        <ChipGroup options={BASIS_OPTIONS} value={form.basis} onChange={form.setBasis} label="Değerler neye göre" />
        <div>
          <label htmlFor={`${id}-serving`} className="label">
            1 porsiyon <span className="font-normal text-fg-subtle">(g{form.basis === "per100g" ? ", isteğe bağlı" : ""})</span>
          </label>
          <input
            id={`${id}-serving`}
            value={form.fields.servingGrams}
            onChange={(e) => form.set("servingGrams", e.target.value)}
            inputMode="decimal"
            autoComplete="off"
            placeholder="örn. 60"
            className="input"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">{MAIN.map((f) => numberField(f, true))}</div>
        {form.suggestedKcal !== null && (
          <p className="hint">
            Makrolara göre yaklaşık {form.suggestedKcal} kcal.{" "}
            <button type="button" onClick={form.applySuggestedKcal} className="link">
              Bunu kullan
            </button>
          </p>
        )}
        <details className="group">
          <summary className="link cursor-pointer text-xs">Ayrıntılar: doymuş yağ, şeker, lif, sodyum</summary>
          <div className="mt-3 grid grid-cols-2 gap-3">{DETAILS.map((f) => numberField(f, false))}</div>
        </details>
      </fieldset>

      <div>
        <label htmlFor={`${id}-grams`} className="label">
          Ne kadar yedin? <span className="font-normal text-fg-subtle">(g)</span>
        </label>
        <input
          id={`${id}-grams`}
          value={form.fields.grams}
          onChange={(e) => form.set("grams", e.target.value)}
          inputMode="decimal"
          autoComplete="off"
          placeholder={form.fields.servingGrams ? `1 porsiyon = ${form.fields.servingGrams} g` : "Gram"}
          className="input"
        />
        {form.previewKcal !== null && <p className="hint tabular-nums">= {form.previewKcal} kcal</p>}
      </div>

      {form.error && (
        <p role="alert" className="alert alert-danger">
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          {form.error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onClose} disabled={form.saving} className="btn btn-secondary">
          Vazgeç
        </button>
        <button type="submit" disabled={form.saving || reading} className="btn btn-primary">
          {form.saving ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Check aria-hidden className="size-4" />}
          {form.saving ? "Kaydediliyor…" : "Kaydet ve ekle"}
        </button>
      </div>
    </form>
  );
}
