/** Local Ollama server used by FitBot and the quick bar's food matcher. */
export const LLM_URL = (process.env.LOCAL_LLM_URL || "http://localhost:11434").replace(/\/+$/, "");
export const LLM_MODEL = process.env.LOCAL_LLM_MODEL || "llama3.2";
/**
 * Context window in tokens. Ollama loads models with a small default (4096 here), and anything past
 * it is cut silently: with the persona, user data, tool definitions, reference excerpts and 20
 * messages that's easily exceeded, so ask for more.
 */
export const NUM_CTX = Number(process.env.LOCAL_LLM_NUM_CTX) || 8192;
/**
 * How long Ollama keeps a model in memory after a request. Its default is 5 minutes, after which
 * the next question pays ~6 s to load the model again.
 */
export const KEEP_ALIVE = process.env.LOCAL_LLM_KEEP_ALIVE || "30m";
/**
 * Optional Ollama vision model for reading nutrition labels (e.g. "qwen2.5vl:7b"). Unset: labels
 * are read with OCR + the rule-based parser only.
 */
export const VISION_MODEL = process.env.LOCAL_VISION_MODEL?.trim() || null;
