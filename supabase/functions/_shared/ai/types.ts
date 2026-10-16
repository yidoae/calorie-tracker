/*
 * The AI boundary (constitution V): every vendor detail of the ai-log function lives in this folder.
 * Plain TypeScript with relative imports and no Deno or Node globals, so tools/aieval imports the
 * same prompt, schema and checks the users get (specs/003-ai-logging/research.md §7).
 */

/** A food the model may choose: our id, Turkish name and typical portion in grams. */
export interface FoodRef {
  id: string;
  name: string;
  typicalPortionG: number;
}

export type AiKind = "photo" | "text";

export interface ProposedItem {
  food_id: string;
  grams: number;
  estimated: boolean;
}

export interface Unmatched {
  description: string;
  grams?: number;
}

/** What the function returns besides the allowance (contracts/ai-log.md). */
export interface AiResult {
  items: ProposedItem[];
  unmatched: Unmatched[];
}

export interface ModelAnswer {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

/** The model failed: an error, a timeout or a body we cannot read. */
export class AiUnavailable extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiUnavailable";
  }
}
