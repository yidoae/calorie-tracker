import {
  BMI_CATEGORIES,
  PACE_LEVELS,
  TRAINING_TYPES,
  bmiCategory,
  calculateBmi,
  calculateBmr,
  calculateTargets,
  calculateTdee,
  goalDirection,
  healthyWeightRange,
  type BmiCategory,
  type Profile,
} from "@/lib/profile";

const BADGE: Record<BmiCategory["tone"], string> = {
  sky: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  emerald: "bg-accent-soft text-accent-text",
  amber: "bg-warning-soft text-warning-text",
  red: "bg-danger-soft text-danger-text",
};

const SEGMENT: Record<BmiCategory["tone"], string> = {
  sky: "bg-sky-400",
  emerald: "bg-accent",
  amber: "bg-amber-400",
  red: "bg-danger",
};

/** The BMI range the gauge draws; values outside it pin to the ends. */
const GAUGE = { min: 15, max: 40 };

const MACRO_TILES = [
  { key: "protein", label: "Protein", kcalPerGram: 4, dot: "bg-macro-protein" },
  { key: "carbs", label: "Carbs", kcalPerGram: 4, dot: "bg-macro-carbs" },
  { key: "fat", label: "Fat", kcalPerGram: 9, dot: "bg-macro-fat" },
] as const;

const tile = "tile";
const tileLabel = "tile-label";

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
      <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full">
        {segments.map(({ category, width }) => (
          <span key={category.label} className={SEGMENT[category.tone]} style={{ width: `${width}%` }} />
        ))}
      </div>
      <span
        aria-hidden
        className="absolute top-0 h-[18px] w-1 -translate-x-1/2 rounded-full bg-fg ring-2 ring-surface-2 transition-[left] duration-300 ease-out"
        style={{ left: `${position}%` }}
      />
    </div>
  );
}

/** BMI, energy needs and suggested daily targets for a valid profile. */
const DIRECTION_LABEL: Record<ReturnType<typeof goalDirection>, string> = {
  cut: "Losing weight",
  bulk: "Gaining weight",
  maintain: "Maintaining weight",
};

export default function ProfileResults({ profile }: { profile: Profile }) {
  const bmi = calculateBmi(profile);
  const category = bmiCategory(bmi);
  const healthy = healthyWeightRange(profile.heightCm);
  const targets = calculateTargets(profile);
  const direction = goalDirection(profile);
  const tdee = calculateTdee(profile);
  const adjustment = Math.round(targets.calories - tdee);

  return (
    <div aria-live="polite" className="space-y-3 border-t border-border pt-5">
      <h3 className="section-title">Results</h3>
      <section aria-label="Goal" className={tile}>
        <p className={tileLabel}>Goal</p>
        <p className="text-sm font-semibold text-fg">
          {DIRECTION_LABEL[direction]}
          {direction !== "maintain" && ` · ${PACE_LEVELS[profile.paceGoal].label}`}
        </p>
        <p className={`${tileLabel} mt-1`}>
          {adjustment === 0 ? "At maintenance calories" : `${adjustment > 0 ? "+" : ""}${adjustment} kcal/day vs. maintenance`} ·{" "}
          {TRAINING_TYPES[profile.trainingType].label}
        </p>
      </section>

      <section aria-label="Body mass index" className={tile}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className={tileLabel}>BMI</p>
            <p className="text-2xl font-semibold tracking-[-0.03em] tabular-nums">{bmi}</p>
          </div>
          <span className={`badge ${BADGE[category.tone]}`}>{category.label}</span>
        </div>
        <div className="mt-2">
          <BmiGauge bmi={bmi} label={category.label} />
        </div>
        <p className="mt-2.5 text-xs text-fg-subtle">
          Normal range for {profile.heightCm} cm: {healthy.min}–{healthy.max} kg. WHO categories for adults
          {profile.age < 18 ? "; for under-18s use growth charts instead." : "."}
        </p>
      </section>

      <section aria-label="Energy needs" className="grid grid-cols-2 gap-2">
        <div className={tile}>
          <p className={tileLabel}>BMR (at rest)</p>
          <p className="tile-value">{Math.round(calculateBmr(profile))} kcal</p>
        </div>
        <div className={tile}>
          <p className={tileLabel}>TDEE (with activity)</p>
          <p className="tile-value">{Math.round(calculateTdee(profile))} kcal</p>
        </div>
      </section>

      <section aria-label="Suggested daily targets" className="pt-2">
        <h3 className="section-title mb-2">Suggested daily targets</h3>
        <div className="rounded-lg border border-accent/25 bg-accent-soft px-3 py-2.5">
          <p className="text-xs text-accent-text">Calories</p>
          <p className="text-xl font-semibold tracking-[-0.02em] tabular-nums text-fg">{targets.calories} kcal</p>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {MACRO_TILES.map(({ key, label, kcalPerGram, dot }) => (
            <div key={key} className={`${tile} min-w-0`}>
              <p className={`${tileLabel} flex items-center gap-1.5`}>
                <span aria-hidden className={`size-1.5 rounded-full ${dot}`} />
                {label}
              </p>
              <p className="tile-value">{targets[key]} g</p>
              <p className={`${tileLabel} tabular-nums`}>{Math.round(((targets[key] * kcalPerGram) / targets.calories) * 100)}% kcal</p>
            </div>
          ))}
        </div>
        <p className="mt-2.5 text-xs text-fg-subtle">
          Maintenance calories (Mifflin-St Jeor). Protein 1.6 g/kg, fat 25% of calories, carbs the rest.
        </p>
      </section>
    </div>
  );
}
