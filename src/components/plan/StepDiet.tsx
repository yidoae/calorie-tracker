import { Beef, Clock, Salad, Scale, UtensilsCrossed, WheatOff } from "lucide-react";
import type { usePlanWizard } from "@/hooks/usePlanWizard";
import { DIET_STYLE_HINTS, DIET_STYLE_LABELS, MEAL_PATTERN_LABELS } from "@/lib/labels";
import { DIET_STYLES, MEAL_PATTERNS, type DietStyle, type MealPattern } from "@/types/plan";
import ChoiceCard from "../ui/ChoiceCard";
import RangeSlider from "../ui/RangeSlider";

type Wizard = ReturnType<typeof usePlanWizard>;

const DIET_ICONS: Record<DietStyle, React.ReactNode> = {
  highProtein: <Beef className="size-5" />,
  lowCarb: <WheatOff className="size-5" />,
  keto: <Salad className="size-5" />,
  iifym: <Scale className="size-5" />,
};

const PATTERN_ICONS: Record<MealPattern, React.ReactNode> = {
  classic: <UtensilsCrossed className="size-5" />,
  if168: <Clock className="size-5" />,
};

/** Step 3: diet style and meal timing (classic 3+2 or 16:8 with a movable eating window). */
export default function StepDiet({ w }: { w: Wizard }) {
  const { form } = w;
  const start = form.fastingWindowStart;

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="label">Beslenme tarzı</legend>
        <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">
          {DIET_STYLES.map((style) => (
            <ChoiceCard
              key={style}
              selected={form.dietStyle === style}
              onSelect={() => w.setDietStyle(style)}
              title={DIET_STYLE_LABELS[style]}
              hint={DIET_STYLE_HINTS[style]}
              icon={DIET_ICONS[style]}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">Öğün düzeni</legend>
        <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">
          {MEAL_PATTERNS.map((pattern) => (
            <ChoiceCard
              key={pattern}
              selected={form.mealPattern === pattern}
              onSelect={() => w.setMealPattern(pattern)}
              title={MEAL_PATTERN_LABELS[pattern].title}
              hint={MEAL_PATTERN_LABELS[pattern].hint}
              icon={PATTERN_ICONS[pattern]}
            />
          ))}
        </div>
      </fieldset>

      {form.mealPattern === "if168" && (
        <div className="animate-enter rounded-[10px] border border-border bg-surface-2 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <label htmlFor="plan-window" className="text-sm font-semibold">
              Yeme penceren
            </label>
            <p className="font-display text-2xl tabular-nums">
              {String(start).padStart(2, "0")}:00 – {String(start + 8).padStart(2, "0")}:00
            </p>
          </div>
          {/* 24 h bar: the eating window in lime, fasting in grey. */}
          <div aria-hidden className="relative mt-3 h-3 overflow-hidden rounded-full bg-surface-3">
            <span className="absolute inset-y-0 rounded-full bg-cta transition-[left] duration-300" style={{ left: `${(start / 24) * 100}%`, width: `${(8 / 24) * 100}%` }} />
          </div>
          <div className="mt-3">
            <RangeSlider
              id="plan-window"
              label="Yeme penceresi başlangıcı"
              value={start}
              min={6}
              max={16}
              step={1}
              onChange={(v) => w.set("fastingWindowStart", v)}
              valueText={`${start}:00 ile ${start + 8}:00 arası`}
            />
          </div>
          <p className="hint">16 saat oruç, 8 saat yeme. Antrenmanı pencerenin içine denk getirmek toparlanmayı kolaylaştırır.</p>
        </div>
      )}
    </div>
  );
}
