import { LOCALE } from "@calorie/core/dates";
import { DIET_STYLE_HINTS, DIET_STYLE_LABELS, MEAL_PATTERN_LABELS } from "@calorie/core/labels";
import { DIET_STYLES, FAT_PER_KG_RANGE, MEAL_PATTERNS, PROTEIN_PER_KG } from "@calorie/core/schemas/plan";
import ChoiceCard from "@/components/setup/ChoiceCard";
import { parseNumber } from "@/hooks/setupSteps";
import Slider from "@/components/ui/Slider";
import type { PlanWizard } from "@/hooks/usePlanWizard";
import { colors } from "@/theme";
import Field from "./Field";
import { formatWindow } from "./format";

const fmt = (n: number, digits: number) => n.toLocaleString(LOCALE, { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Step 3: diet style, fat per kg and the meal pattern (classic or 16:8 with a movable window). */
export default function StepDiet({ w }: { w: PlanWizard }) {
  const { form } = w;
  const keto = form.dietStyle === "keto";
  const weight = parseNumber(form.weightKg);
  const fatGrams = weight === null ? "" : ` ≈ ${Math.round(weight * form.fatPerKg)} g`;

  return (
    <>
      <Field label="Beslenme tarzın" radiogroup>
        {DIET_STYLES.map((style) => (
          <ChoiceCard key={style} title={DIET_STYLE_LABELS[style]} hint={DIET_STYLE_HINTS[style]} selected={form.dietStyle === style} onPress={() => w.setDietStyle(style)} />
        ))}
      </Field>

      <Field
        label="Yağ (kilo başına)"
        value={`${fmt(form.fatPerKg, 2)} g/kg${fatGrams}`}
        hint={
          keto
            ? "Ketojenikte karbonhidrat 15–30 g'da sabit; yağ kalan kaloriyi tamamlar."
            : `Protein kilo başına ${fmt(PROTEIN_PER_KG, 1)} g sabit; karbonhidrat kalan kaloriyi tamamlar.`
        }
      >
        <Slider
          label="Kilo başına yağ"
          value={form.fatPerKg}
          min={FAT_PER_KG_RANGE.min}
          max={FAT_PER_KG_RANGE.max}
          step={FAT_PER_KG_RANGE.step}
          onChange={(v) => w.set("fatPerKg", v)}
          valueText={`Kilogram başına ${fmt(form.fatPerKg, 2)} gram yağ`}
          color={colors.macroFat}
          disabled={keto}
        />
      </Field>

      <Field label="Öğün düzenin" radiogroup>
        {MEAL_PATTERNS.map((pattern) => (
          <ChoiceCard
            key={pattern}
            title={MEAL_PATTERN_LABELS[pattern].title}
            hint={MEAL_PATTERN_LABELS[pattern].hint}
            selected={form.mealPattern === pattern}
            onPress={() => w.setMealPattern(pattern)}
          />
        ))}
      </Field>

      {form.mealPattern === "if168" && (
        <Field label="Yeme penceren" value={formatWindow(form.fastingWindowStart)} hint="16 saat oruç, 8 saat yeme. Antrenmanı pencerenin içine denk getirmek toparlanmayı kolaylaştırır.">
          <Slider
            label="Yeme penceresinin başlangıcı"
            value={form.fastingWindowStart}
            min={6}
            max={16}
            step={1}
            onChange={(v) => w.set("fastingWindowStart", v)}
            valueText={formatWindow(form.fastingWindowStart)}
          />
        </Field>
      )}
    </>
  );
}
