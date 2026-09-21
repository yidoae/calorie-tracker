import {
  BMI_CATEGORIES,
  bmiCategory,
  calculateBmi,
  calculateBmr,
  calculateTargets,
  calculateTdee,
  healthyWeightRange,
  type BmiCategory,
  type Profile,
} from "@/lib/profile";

const BADGE: Record<BmiCategory["tone"], string> = {
  sky: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  emerald: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  red: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

const SEGMENT: Record<BmiCategory["tone"], string> = {
  sky: "bg-sky-400",
  emerald: "bg-emerald-500",
  amber: "bg-amber-400",
  red: "bg-red-500",
};

/** The BMI range the gauge draws; values outside it pin to the ends. */
const GAUGE = { min: 15, max: 40 };

const MACRO_TILES = [
  { key: "protein", label: "Protein", kcalPerGram: 4, color: "text-rose-600 dark:text-rose-400" },
  { key: "carbs", label: "Carbs", kcalPerGram: 4, color: "text-sky-600 dark:text-sky-400" },
  { key: "fat", label: "Fat", kcalPerGram: 9, color: "text-amber-600 dark:text-amber-400" },
] as const;

const tile = "rounded-xl bg-zinc-100 p-3 dark:bg-zinc-800";
const tileLabel = "text-xs text-zinc-500 dark:text-zinc-400";

function BmiGauge({ bmi, label }: { bmi: number; label: string }) {
  const span = GAUGE.max - GAUGE.min;
  const segments = BMI_CATEGORIES.map((category, i) => {
    const lower = i === 0 ? GAUGE.min : BMI_CATEGORIES[i - 1].max;
    const upper = Math.min(category.max, GAUGE.max);
    return { category, width: ((upper - lower) / span) * 100 };
  });
  const position = Math.min(100, Math.max(0, ((bmi - GAUGE.min) / span) * 100));

  return (
    <div role="img" aria-label={`BMI ${bmi}, ${label}`} className="relative pt-1.5">
      <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
        {segments.map(({ category, width }) => (
          <span key={category.label} className={SEGMENT[category.tone]} style={{ width: `${width}%` }} />
        ))}
      </div>
      <span
        aria-hidden
        className="absolute top-0 h-4 w-1 -translate-x-1/2 rounded-full bg-foreground ring-2 ring-white dark:ring-zinc-900"
        style={{ left: `${position}%` }}
      />
    </div>
  );
}

/** BMI, energy needs and suggested daily targets for a valid profile. */
export default function ProfileResults({ profile }: { profile: Profile }) {
  const bmi = calculateBmi(profile);
  const category = bmiCategory(bmi);
  const healthy = healthyWeightRange(profile.heightCm);
  const targets = calculateTargets(profile);

  return (
    <div aria-live="polite" className="space-y-4">
      <section aria-label="Body mass index" className={tile}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className={tileLabel}>BMI</p>
            <p className="text-2xl font-bold tabular-nums">{bmi}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${BADGE[category.tone]}`}>{category.label}</span>
        </div>
        <div className="mt-2">
          <BmiGauge bmi={bmi} label={category.label} />
        </div>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Normal range for {profile.heightCm} cm: {healthy.min}–{healthy.max} kg. WHO categories for adults
          {profile.age < 18 ? "; for under-18s use growth charts instead." : "."}
        </p>
      </section>

      <section aria-label="Energy needs" className="grid grid-cols-2 gap-3">
        <div className={tile}>
          <p className={tileLabel}>BMR (at rest)</p>
          <p className="font-semibold tabular-nums">{Math.round(calculateBmr(profile))} kcal</p>
        </div>
        <div className={tile}>
          <p className={tileLabel}>TDEE (with activity)</p>
          <p className="font-semibold tabular-nums">{Math.round(calculateTdee(profile))} kcal</p>
        </div>
      </section>

      <section aria-label="Suggested daily targets">
        <h3 className="mb-2 text-sm font-medium">Suggested daily targets</h3>
        <div className="rounded-xl bg-orange-50 p-3 dark:bg-orange-950/40">
          <p className={tileLabel}>Calories</p>
          <p className="text-xl font-bold tabular-nums text-orange-600 dark:text-orange-400">{targets.calories} kcal</p>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {MACRO_TILES.map(({ key, label, kcalPerGram, color }) => (
            <div key={key} className={tile}>
              <p className={tileLabel}>{label}</p>
              <p className={`font-bold tabular-nums ${color}`}>{targets[key]} g</p>
              <p className={`${tileLabel} tabular-nums`}>{Math.round(((targets[key] * kcalPerGram) / targets.calories) * 100)}% kcal</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Maintenance calories (Mifflin-St Jeor). Protein 1.6 g/kg, fat 25% of calories, carbs the rest.
        </p>
      </section>
    </div>
  );
}
