"use client";

import { Activity, Armchair, Beef, Bike, Dumbbell, Footprints, Loader2, Salad, Scale, WheatOff, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { ACTIVITY_LEVEL_LABELS, DIET_STYLE_HINTS, DIET_STYLE_LABELS, GOAL_LABELS } from "@/lib/labels";
import { DIET_STYLES, type DietStyle } from "@/types/plan";
import { ACTIVITY_LEVEL_KEYS, PROFILE_LIMITS, type ActivityLevel } from "@/types/profile";
import MaskedWords from "../landing/MaskedWords";
import SiteHeader from "../layout/SiteHeader";
import FatPerKgControl from "../plan/FatPerKgControl";
import LivePreview from "../plan/LivePreview";
import ChoiceCard from "../ui/ChoiceCard";
import { SPRING_SCENE, staggerDelay } from "../ui/motion";

const ACTIVITY_ICONS: Record<ActivityLevel, React.ReactNode> = {
  sedentary: <Armchair className="size-5" />,
  light: <Footprints className="size-5" />,
  moderate: <Bike className="size-5" />,
  active: <Dumbbell className="size-5" />,
  veryActive: <Zap className="size-5" />,
};

const DIET_ICONS: Record<DietStyle, React.ReactNode> = {
  highProtein: <Beef className="size-5" />,
  lowCarb: <WheatOff className="size-5" />,
  keto: <Salad className="size-5" />,
  iifym: <Scale className="size-5" />,
};

const FIELDS = [
  { key: "age", label: "Yaş", unit: "yıl", limit: "age" },
  { key: "heightCm", label: "Boy", unit: "cm", limit: "heightCm" },
  { key: "weightKg", label: "Mevcut kilo", unit: "kg", limit: "weightKg" },
  { key: "targetWeightKg", label: "Hedef kilo", unit: "kg", limit: "weightKg" },
] as const;

const section = (i: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { ...SPRING_SCENE, delay: 0.25 + staggerDelay(i, 0.08) } },
});

/** /baslangic: the required first-time setup. Body, activity and diet in one form; live targets on the side. */
export default function Onboarding() {
  const o = useOnboarding();
  const { form } = o;

  return (
    <>
      <SiteHeader />
      <section className="bg-ink text-on-ink">
        <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-12 sm:px-6">
          <p className="text-xs font-semibold tracking-[0.05em] text-cta uppercase">İlk adım · 1 dakika</p>
          <h1 className="mt-4 font-display text-4xl leading-[1.05] sm:text-6xl">
            <MaskedWords text="Seni tanıyalım." />
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-on-ink-muted sm:text-base">
            Kalori ve makro hedeflerini bu bilgilerden hesaplıyoruz: protein kilo başına 2,2 g, yağ seçtiğin oranda, karbonhidrat kalanı tamamlar.
          </p>
        </div>
      </section>

      <main className="flex-1 rounded-t-[24px] bg-bg sm:rounded-t-[40px]">
        <form
          onSubmit={(e) => void o.submit(e)}
          noValidate
          className="mx-auto grid w-full max-w-6xl gap-6 px-4 pt-6 pb-24 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:pt-10"
        >
          <div className="space-y-6">
            <motion.fieldset {...section(0)} className="card space-y-4 p-4 sm:p-6">
              <legend className="sr-only">Vücut bilgileri</legend>
              <h2 className="card-title">Vücut bilgileri</h2>
              <div>
                <p id="onb-sex-label" className="label">
                  Cinsiyet
                </p>
                <div role="radiogroup" aria-labelledby="onb-sex-label" className="grid grid-cols-2 gap-1 rounded-[6px] border border-border-strong bg-surface p-1">
                  {(["male", "female"] as const).map((sex) => (
                    <button
                      key={sex}
                      type="button"
                      role="radio"
                      aria-checked={form.sex === sex}
                      onClick={() => o.set("sex", sex)}
                      className={`h-9 cursor-pointer rounded-[4px] text-sm font-semibold outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring ${
                        form.sex === sex ? "bg-ink text-on-ink" : "text-fg-muted hover:text-fg"
                      }`}
                    >
                      {sex === "male" ? "Erkek" : "Kadın"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {FIELDS.map(({ key, label, unit, limit }) => (
                  <div key={key}>
                    <label htmlFor={`onb-${key}`} className="label truncate">
                      {label} <span className="font-normal text-fg-subtle">({unit})</span>
                    </label>
                    <input
                      id={`onb-${key}`}
                      type="number"
                      inputMode="decimal"
                      step="any"
                      required
                      value={form[key]}
                      onChange={(e) => o.set(key, e.target.value)}
                      aria-invalid={o.errors[key]}
                      className="input"
                    />
                    {o.errors[key] && (
                      <p className="error-text">
                        {PROFILE_LIMITS[limit].min}–{PROFILE_LIMITS[limit].max} {unit}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              {o.goal && (
                <p className="flex items-center gap-2 text-[13px] text-fg-muted">
                  <Activity aria-hidden className="size-4 text-accent" />
                  Hedefin: <span className="font-semibold text-fg">{GOAL_LABELS[o.goal].title}</span>
                </p>
              )}
            </motion.fieldset>

            <motion.fieldset {...section(1)} className="card p-4 sm:p-6">
              <legend className="sr-only">Aktivite seviyesi</legend>
              <h2 className="card-title">Aktivite seviyesi</h2>
              <div role="radiogroup" aria-label="Aktivite seviyesi" className="mt-4 grid gap-3 sm:grid-cols-2">
                {ACTIVITY_LEVEL_KEYS.map((level) => (
                  <ChoiceCard
                    key={level}
                    selected={form.activity === level}
                    onSelect={() => o.set("activity", level)}
                    title={ACTIVITY_LEVEL_LABELS[level].title}
                    hint={ACTIVITY_LEVEL_LABELS[level].hint}
                    icon={ACTIVITY_ICONS[level]}
                  />
                ))}
              </div>
            </motion.fieldset>

            <motion.fieldset {...section(2)} className="card space-y-4 p-4 sm:p-6">
              <legend className="sr-only">Beslenme tercihi</legend>
              <h2 className="card-title">Beslenme tercihi</h2>
              <div role="radiogroup" aria-label="Beslenme tercihi" className="grid gap-3 sm:grid-cols-2">
                {DIET_STYLES.map((style) => (
                  <ChoiceCard
                    key={style}
                    selected={form.dietStyle === style}
                    onSelect={() => o.set("dietStyle", style)}
                    title={DIET_STYLE_LABELS[style]}
                    hint={DIET_STYLE_HINTS[style]}
                    icon={DIET_ICONS[style]}
                  />
                ))}
              </div>
              <FatPerKgControl
                id="onb-fat-per-kg"
                value={form.fatPerKg}
                weightKg={o.weightKg}
                onChange={(v) => o.set("fatPerKg", v)}
                disabled={form.dietStyle === "keto"}
              />
            </motion.fieldset>
          </div>

          <motion.div {...section(1)} className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <LivePreview preview={o.preview} />
            {o.error && (
              <p role="alert" className="alert alert-danger">
                {o.error}
              </p>
            )}
            <button type="submit" disabled={!o.canSubmit} className="btn btn-primary btn-lg w-full">
              {o.pending && <Loader2 aria-hidden className="size-4 animate-spin" />}
              Planımı oluştur ve başla
            </button>
            {!o.preview && <p className="hint text-center">Dört alanı da doldurunca hedeflerin burada belirir.</p>}
          </motion.div>
        </form>
      </main>
    </>
  );
}
