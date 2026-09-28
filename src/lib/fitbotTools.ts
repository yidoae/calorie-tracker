import {
  ACTIVITY_LEVELS,
  PACE_LEVELS,
  TRAINING_TYPES,
  bmiCategory,
  calculateBmi,
  calculateBmr,
  calculateTargets,
  calculateTdee,
  goalDirection,
  isValidProfile,
  type ActivityLevel,
  type Gender,
  type PaceLevel,
  type Profile,
  type TrainingType,
} from "./profile";

/**
 * Calculators FitBot can call (Ollama tool calling) for numbers that aren't already in the user's
 * data block, e.g. "what would my targets be at 80 kg?". The arithmetic runs here, in the same code
 * the app uses, so the model only has to pick the tool and read the result.
 */

interface ToolDefinition {
  type: "function";
  function: { name: string; description: string; parameters: object };
}

const num = (description: string) => ({ type: "number", description });

export const FITBOT_TOOLS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "calculate_targets",
      description:
        "Daily calorie/protein/carb/fat targets (plus BMI, BMR, TDEE) for a HYPOTHETICAL body or goal, " +
        "e.g. 'what if I weighed 80 kg' or 'what if my goal were 75 kg'. Only pass the fields that change; " +
        "the rest come from the saved profile. Do NOT use it for the user's current targets — those are in the user's data.",
      parameters: {
        type: "object",
        properties: {
          weight_kg: num("Hypothetical CURRENT body weight in kg. 'If I weighed 80 kg' -> weight_kg: 80"),
          target_weight_kg: num("Hypothetical GOAL body weight in kg. 'If my goal were 75 kg' -> target_weight_kg: 75"),
          height_cm: num("Height in cm"),
          age: num("Age in years"),
          gender: { type: "string", enum: ["male", "female"] },
          activity: { type: "string", enum: Object.keys(ACTIVITY_LEVELS) },
          pace: { type: "string", enum: Object.keys(PACE_LEVELS), description: "How fast to lose/gain weight" },
          training: { type: "string", enum: Object.keys(TRAINING_TYPES) },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "macros_to_calories",
      description:
        "Convert grams of protein, carbs and fat into calories. Example: '30 g protein, 50 g carbs, 10 g fat' -> " +
        "protein_g: 30, carbs_g: 50, fat_g: 10. Do NOT use it for the user's daily totals or remaining macros.",
      parameters: {
        type: "object",
        properties: { protein_g: num("Protein in grams"), carbs_g: num("Carbohydrates in grams"), fat_g: num("Fat in grams") },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "weeks_to_goal",
      description:
        "Estimate how many weeks it takes to go from the current weight to a goal weight at a weekly rate. " +
        "Weights default to the saved profile. 'At 0.5 kg per week' -> kg_per_week: 0.5.",
      parameters: {
        type: "object",
        properties: {
          current_weight_kg: num("Current body weight in kg (defaults to the saved profile)"),
          target_weight_kg: num("Goal body weight in kg (defaults to the saved profile)"),
          kg_per_week: num("Weekly change in kg, e.g. 0.5. Defaults to the pace in the saved profile."),
        },
      },
    },
  },
];

type Args = Record<string, unknown>;

/** Midpoint of each pace label in PACE_LEVELS, for when the model doesn't pass a rate. */
const PACE_KG_PER_WEEK: Record<PaceLevel, number> = { slow: 0.25, moderate: 0.5, aggressive: 0.75 };

/** Models sometimes send numbers as strings ("80" or "80 kg"); accept those, reject anything else. */
function toNumber(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number.parseFloat(v.replace(",", "."));
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function pick<T extends string>(v: unknown, allowed: Record<T, unknown>): T | undefined {
  return typeof v === "string" && v in allowed ? (v as T) : undefined;
}

function calculateTargetsTool(args: Args, profile: Profile | null) {
  const base: Partial<Profile> = profile ?? {};
  const candidate: Profile = {
    id: "what-if",
    label: "what-if",
    gender: (pick<Gender>(args.gender, { male: 1, female: 1 }) ?? base.gender) as Gender,
    heightCm: toNumber(args.height_cm) ?? (base.heightCm as number),
    weightKg: toNumber(args.weight_kg) ?? (base.weightKg as number),
    age: toNumber(args.age) ?? (base.age as number),
    activity: pick<ActivityLevel>(args.activity, ACTIVITY_LEVELS) ?? base.activity ?? "moderate",
    targetWeightKg: toNumber(args.target_weight_kg) ?? base.targetWeightKg ?? null,
    paceGoal: pick<PaceLevel>(args.pace, PACE_LEVELS) ?? base.paceGoal ?? "moderate",
    trainingType: pick<TrainingType>(args.training, TRAINING_TYPES) ?? base.trainingType ?? "rest",
  };
  const required = { gender: "gender", heightCm: "height_cm", weightKg: "weight_kg", age: "age" } as const;
  const missing = (Object.keys(required) as (keyof typeof required)[]).filter((k) => candidate[k] === undefined).map((k) => required[k]);
  if (missing.length > 0) {
    return { error: `Missing ${missing.join(", ")} — ask the user for them (there is no saved profile to fill them in).` };
  }
  if (!isValidProfile(candidate)) {
    return { error: "Values out of range: height 100–250 cm, weight 30–300 kg, age 15–100." };
  }
  const bmi = calculateBmi(candidate);
  const t = calculateTargets(candidate);
  return {
    summary:
      `For ${candidate.weightKg} kg, ${candidate.heightCm} cm, age ${candidate.age}, goal ${goalDirection(candidate)}` +
      `${candidate.targetWeightKg != null ? ` to ${candidate.targetWeightKg} kg` : ""}: ` +
      `${t.calories} kcal per day, protein ${t.protein} g, carbs ${t.carbs} g, fat ${t.fat} g ` +
      `(BMI ${bmi}, maintenance/TDEE ${Math.round(calculateTdee(candidate))} kcal).`,
    inputs: {
      gender: candidate.gender,
      height_cm: candidate.heightCm,
      weight_kg: candidate.weightKg,
      age: candidate.age,
      target_weight_kg: candidate.targetWeightKg,
      goal: goalDirection(candidate),
      pace: PACE_LEVELS[candidate.paceGoal].label,
      activity: ACTIVITY_LEVELS[candidate.activity].label,
      training: TRAINING_TYPES[candidate.trainingType].label,
    },
    bmi,
    bmi_category: bmiCategory(bmi).label,
    bmr_kcal: Math.round(calculateBmr(candidate)),
    tdee_kcal: Math.round(calculateTdee(candidate)),
    daily_targets: { calories_kcal: t.calories, protein_g: t.protein, carbs_g: t.carbs, fat_g: t.fat },
  };
}

function macrosToCaloriesTool(args: Args) {
  const protein = toNumber(args.protein_g) ?? 0;
  const carbs = toNumber(args.carbs_g) ?? 0;
  const fat = toNumber(args.fat_g) ?? 0;
  if ([protein, carbs, fat].some((g) => g < 0)) return { error: "Grams can't be negative." };
  const kcal = { protein: protein * 4, carbs: carbs * 4, fat: fat * 9 };
  const total = kcal.protein + kcal.carbs + kcal.fat;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
  return {
    summary:
      `${protein} g protein + ${carbs} g carbs + ${fat} g fat = ${Math.round(total)} kcal ` +
      `(protein ${Math.round(kcal.protein)} kcal / ${pct(kcal.protein)}%, carbs ${Math.round(kcal.carbs)} kcal / ${pct(kcal.carbs)}%, ` +
      `fat ${Math.round(kcal.fat)} kcal / ${pct(kcal.fat)}%). Protein and carbs have 4 kcal/g, fat 9 kcal/g.`,
    total_kcal: Math.round(total),
    protein_kcal: Math.round(kcal.protein),
    carbs_kcal: Math.round(kcal.carbs),
    fat_kcal: Math.round(kcal.fat),
  };
}

function weeksToGoalTool(args: Args, profile: Profile | null) {
  const current = toNumber(args.current_weight_kg) ?? profile?.weightKg;
  const target = toNumber(args.target_weight_kg) ?? profile?.targetWeightKg ?? undefined;
  // Models sometimes send 0 or nothing; fall back to the profile's pace rather than failing.
  const given = toNumber(args.kg_per_week);
  const rate = given !== undefined && given > 0 ? given : profile ? PACE_KG_PER_WEEK[profile.paceGoal] : undefined;
  if (current === undefined || target === undefined) return { error: "Need both the current and the target weight — ask the user." };
  if (rate === undefined) return { error: "Need a weekly rate in kg, e.g. kg_per_week: 0.5 — ask the user." };
  const change = Math.abs(target - current);
  const weeks = change / rate;
  return {
    summary:
      `From ${current} kg to ${target} kg (${Math.round(change * 10) / 10} kg) at ${rate} kg/week takes about ` +
      `${Math.round(weeks * 10) / 10} weeks (~${Math.round((weeks / 4.345) * 10) / 10} months). Real progress is rarely linear.`,
    current_weight_kg: current,
    target_weight_kg: target,
    kg_per_week: rate,
    change_kg: Math.round(change * 10) / 10,
    weeks: Math.round(weeks * 10) / 10,
    months: Math.round((weeks / 4.345) * 10) / 10,
  };
}

/** Runs one tool call. Never throws: problems are returned to the model as `{ error }` so it can recover. */
export function runFitbotTool(name: string, rawArgs: unknown, profile: Profile | null): object {
  const args: Args = rawArgs && typeof rawArgs === "object" ? (rawArgs as Args) : {};
  switch (name) {
    case "calculate_targets":
      return calculateTargetsTool(args, profile);
    case "macros_to_calories":
      return macrosToCaloriesTool(args);
    case "weeks_to_goal":
      return weeksToGoalTool(args, profile);
    default:
      return { error: `Unknown tool "${name}". Available: ${FITBOT_TOOLS.map((t) => t.function.name).join(", ")}.` };
  }
}
