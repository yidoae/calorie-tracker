import { randomUUID } from "node:crypto";
import { formulaPlan, formulaSummary } from "@/lib/nutrition/plan";
import type { GeneratePlanResponse, PlanInputs } from "@/types/plan";
import { generateAiPlan } from "./aiStrategy";

export const AI_UNAVAILABLE_NOTICE = "AI koç servisine erişilemedi, standart bilimsel formülle plan oluşturuldu.";

/**
 * Builds a draft plan: the Harris-Benedict baseline always, refined by the local LLM when it's
 * available. Never throws for AI problems; the fallback plan comes with a notice instead.
 */
export async function generatePlan(inputs: PlanInputs): Promise<GeneratePlanResponse> {
  const formula = formulaPlan(inputs);
  const ai = await generateAiPlan(inputs, formula);
  const common = { id: randomUUID(), createdAt: new Date().toISOString(), inputs, bmr: formula.bmr, tdee: formula.tdee };

  if (!ai) {
    return {
      plan: { ...common, source: "formula", base: formula.base, cycle: formula.cycle, strategySummary: formulaSummary(inputs, formula) },
      notice: AI_UNAVAILABLE_NOTICE,
    };
  }
  return {
    plan: {
      ...common,
      source: "ai",
      base: ai.base,
      cycle: ai.cycle,
      strategySummary: ai.strategySummary ?? formulaSummary(inputs, { ...formula, base: ai.base, cycle: ai.cycle }),
    },
    notice: null,
  };
}
