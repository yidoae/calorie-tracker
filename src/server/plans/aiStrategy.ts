import { DIET_STYLE_LABELS, GOAL_LABELS, MEAL_PATTERN_LABELS, SPLIT_LABELS, TRAINING_STYLE_LABELS, WEEKDAY_SHORT } from "@/lib/labels";
import { cycleTargets, macrosFor, type FormulaResult } from "@/lib/nutrition/plan";
import type { DayTargets, PlanInputs } from "@/types/plan";
import { z } from "@/types/zod";
import { ollamaChat, parseJsonAnswer } from "../llm/ollama";

/*
 * FitBot's plan strategy, in two small calls that a 3B local model handles reliably:
 * 1. Numbers as JSON (constrained by a schema): the model may adjust the formula's calories; they
 *    are clamped, and the macros are always re-derived with the macro engine (protein 2.2 g/kg,
 *    fat g/kg as chosen, carbs fill the rest), so the model can't skew them.
 * 2. The coach summary as plain text with a hard token cap, written after the numbers are final.
 *    (Long Turkish text inside JSON made llama3.2 ramble and break string escapes.)
 * Any failure returns null; the caller then uses the Harris-Benedict fallback.
 */

const NUMBERS_TIMEOUT_MS = 60_000; // the first request after idle also loads the model into memory
const SUMMARY_TIMEOUT_MS = 45_000;

const dayJson = z.object({ calories: z.number(), protein: z.number(), carbs: z.number(), fat: z.number() });
const aiNumbersSchema = dayJson.extend({ trainingDay: dayJson.nullable(), restDay: dayJson.nullable() });

export interface AiPlan {
  base: DayTargets;
  cycle: { training: DayTargets; rest: DayTargets } | null;
  /** Null when the model's text wasn't usable (the caller then uses the formula summary). */
  strategySummary: string | null;
}

const trainingDaysText = (inputs: PlanInputs) => inputs.trainingDays.map((d) => WEEKDAY_SHORT[d]).join(", ");

function describe(inputs: PlanInputs): string {
  return [
    `Kişi: ${inputs.sex === "male" ? "erkek" : "kadın"}, ${inputs.age} yaş, ${inputs.heightCm} cm, ${inputs.weightKg} kg${inputs.targetWeightKg ? `, hedef kilo ${inputs.targetWeightKg} kg` : ""}.`,
    `Hedef: ${GOAL_LABELS[inputs.goal].title}${inputs.goal !== "maintain" ? ` (günlük ${inputs.intensity} kcal ${inputs.goal === "cut" ? "açık" : "fazla"})` : ""}.`,
    `Antrenman: ${TRAINING_STYLE_LABELS[inputs.trainingStyle]}${inputs.split ? ` (${SPLIT_LABELS[inputs.split]})` : ""}${inputs.trainingStyle !== "sedentary" ? `, haftada ${inputs.trainingDays.length} gün (${trainingDaysText(inputs)})` : ""}.`,
    `Beslenme tarzı: ${DIET_STYLE_LABELS[inputs.dietStyle]}. Öğün düzeni: ${MEAL_PATTERN_LABELS[inputs.mealPattern].title}${inputs.mealPattern === "if168" ? ` (yeme penceresi ${inputs.fastingWindowStart}:00–${inputs.fastingWindowStart + 8}:00)` : ""}.`,
  ].join("\n");
}

const NUMBERS_SYSTEM = `You are a sports nutrition calculator. You get a person's data and a formula baseline.
Return the final daily targets as JSON. Start from the baseline; change calories by at most 5% and only for a clear
reason (e.g. very high training volume). Keep 4*protein + 4*carbs + 9*fat equal to calories.
trainingDay and restDay: only when calorie cycling is on, otherwise null; their weekly average must equal the daily calories.`;

function numbersPrompt(inputs: PlanInputs, formula: FormulaResult): string {
  const lines = [
    describe(inputs),
    `Formül tabanı (Harris-Benedict): hedef ${formula.base.calories} kcal, protein ${formula.base.protein} g, karbonhidrat ${formula.base.carbs} g, yağ ${formula.base.fat} g.`,
    `Kalori döngüsü: ${formula.cycle ? `açık; formül antrenman günü ${formula.cycle.training.calories} kcal, dinlenme günü ${formula.cycle.rest.calories} kcal` : "kapalı"}.`,
  ];
  return lines.join("\n");
}

const SUMMARY_SYSTEM = `Sen FitBot'sun: samimi, enerjik ve net bir spor beslenme koçu.
Kullanıcıya "sen" diye hitap ederek 2-3 kısa Türkçe cümleyle kişisel strateji yaz: biri motive edici, biri taktiksel
(antrenman günleri, beslenme tarzı veya öğün zamanlaması hakkında somut bir ipucu).
Kurallar: Yalnızca verilen bilgileri ve sayıları kullan; kişinin seçmediği bir öğün düzeninden veya antrenmandan bahsetme.
Düzgün Türkçe yaz, İngilizce kelime kullanma. Başlık, madde işareti veya tırnak kullanma.`;

function summaryPrompt(inputs: PlanInputs, base: DayTargets, cycle: AiPlan["cycle"]): string {
  return [
    describe(inputs),
    `Son plan: günlük ${base.calories} kcal, protein ${base.protein} g, karbonhidrat ${base.carbs} g, yağ ${base.fat} g.`,
    cycle ? `Antrenman günü ${cycle.training.calories} kcal, dinlenme günü ${cycle.rest.calories} kcal.` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** The model's calories, clamped; the macros come from the engine with the reference grams. */
function sanitizeDay(raw: z.infer<typeof dayJson>, reference: DayTargets, inputs: PlanInputs): DayTargets {
  // ±5%: the AI may personalise, but not undo the deficit/surplus the user picked on the slider.
  const calories = Math.min(reference.calories * 1.05, Math.max(reference.calories * 0.95, raw.calories));
  return macrosFor(calories, { protein: reference.protein, fat: reference.fat }, inputs.dietStyle);
}

/** Letters outside the Turkish alphabet (e.g. "ź"), a sign of a garbled answer. */
const FOREIGN_LETTER = /[^\s\d.,;:!?%'’"()\-–—/+×~≈a-zA-ZçğıöşüÇĞİÖŞÜâîûÂÎÛ]/;
/** English words small models slip into Turkish text. */
const ENGLISH_WORD = /\b(execute|gain|energy|energi|workout|meal|training|the|and|your)\b/i;
/** A syllable repeated three times ("setlerininini"). */
const STUTTER = /(\p{L}{2,3})\1\1/u;
/** Phrases that contradict the goal (a fat-loss plan talking about weight gain, and vice versa). */
const CONTRADICTS: Record<PlanInputs["goal"], RegExp | null> = {
  cut: /kilo al|ağırlık artış|kilo artış|kas kazanım|fazla tüket/i,
  bulk: /kilo ver|yağ yakım|kilo kayb|açık oluştur/i,
  maintain: null,
};

/**
 * First 3 complete sentences of the coach's text, if it passes a quality gate: Turkish only, no
 * garbled words, nothing that contradicts the goal. A 3B model often fails this; the caller then
 * shows the formula summary instead (the AI's numbers are still used).
 */
export function cleanSummary(text: string | null, goal: PlanInputs["goal"]): string | null {
  if (!text) return null;
  const cleaned = text.replace(/^["'“”\s]+|["'“”\s]+$/g, "").replace(/\s+/g, " ").replace(/[*#]/g, "").trim();
  // A sentence ends at . ! ? followed by a space or the end, so "2.667 kcal" and "0,45" stay whole.
  const sentences = cleaned.match(/.+?[.!?](?=\s|$)/g)?.map((s) => s.trim()) ?? [];
  const summary = sentences.slice(0, 3).join(" ");
  const problems = [
    !/[çğıöşü]/i.test(summary) && "not Turkish",
    (summary.length < 40 || summary.length > 600) && "length",
    FOREIGN_LETTER.test(summary) && "foreign letters",
    ENGLISH_WORD.test(summary) && "English words",
    STUTTER.test(summary) && "garbled word",
    CONTRADICTS[goal]?.test(summary) && "contradicts goal",
  ].filter(Boolean);
  if (problems.length > 0) {
    console.info(`Plan AI: summary rejected (${problems.join(", ")})`);
    return null;
  }
  return summary;
}

/** The AI-adjusted plan, or null if the LLM is unavailable or its numbers aren't usable. */
export async function generateAiPlan(inputs: PlanInputs, formula: FormulaResult): Promise<AiPlan | null> {
  const numbers = aiNumbersSchema.safeParse(
    parseJsonAnswer(
      await ollamaChat({
        system: NUMBERS_SYSTEM,
        user: numbersPrompt(inputs, formula),
        format: z.toJSONSchema(aiNumbersSchema),
        maxTokens: 200,
        timeoutMs: NUMBERS_TIMEOUT_MS,
      }),
    ),
  );
  if (!numbers.success) {
    console.warn("Plan AI: numbers unusable");
    return null;
  }
  const ai = numbers.data;

  const base = sanitizeDay(ai, formula.base, inputs);
  const days = inputs.trainingStyle === "sedentary" ? 0 : inputs.trainingDays.length;
  let cycle = inputs.cycling ? cycleTargets(base, inputs.dietStyle, days) : null;
  if (cycle && ai.trainingDay && ai.restDay) {
    const training = sanitizeDay(ai.trainingDay, cycle.training, inputs);
    const rest = sanitizeDay(ai.restDay, cycle.rest, inputs);
    const average = (training.calories * days + rest.calories * (7 - days)) / 7;
    // Keep the model's split only if it still averages to the daily target and trains higher.
    if (Math.abs(average - base.calories) <= base.calories * 0.05 && training.calories > rest.calories) cycle = { training, rest };
  }

  const summary = cleanSummary(
    await ollamaChat({
      system: SUMMARY_SYSTEM,
      user: summaryPrompt(inputs, base, cycle),
      maxTokens: 220,
      temperature: 0.6,
      timeoutMs: SUMMARY_TIMEOUT_MS,
    }),
    inputs.goal,
  );
  return { base, cycle, strategySummary: summary };
}
