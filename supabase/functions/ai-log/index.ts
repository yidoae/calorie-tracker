import { createClient } from "npm:@supabase/supabase-js@2";
import type { AiResult, FoodRef } from "../_shared/ai/types.ts";
import { geminiModel, handle, type Allowance, type Claim, type Deps } from "./handler.ts";

/*
 * The ai-log Edge Function: wires handler.ts to Supabase (service role for the allowance, the
 * caller's token for their own allowance) and to Gemini. Secrets: GEMINI_API_KEY, GEMINI_MODEL;
 * SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY come with the runtime.
 */

const url = Deno.env.get("SUPABASE_URL")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const modelName = Deno.env.get("GEMINI_MODEL") ?? "gemini-3.5-flash-lite";

// The food list changes only with a migration; one read per cold start.
let foodCache: Promise<FoodRef[]> | null = null;
async function loadFoods(): Promise<FoodRef[]> {
  const { data, error } = await admin.from("foods").select("id, name_tr, typical_portion_g").eq("searchable", true).order("id");
  if (error) throw error;
  return data.map((f) => ({ id: f.id, name: f.name_tr, typicalPortionG: Number(f.typical_portion_g) }));
}

const deps: Deps = {
  async userId(token) {
    const { data } = await admin.auth.getUser(token);
    return data.user?.id ?? null;
  },
  async claim(userId, requestKey, kind) {
    const { data, error } = await admin.rpc("ai_claim", { user_id: userId, request_key: requestKey, kind });
    if (error) throw error;
    return data as Claim;
  },
  async finish(id, f) {
    const { error } = await admin.rpc("ai_finish", {
      id,
      status: f.status,
      model: f.model,
      latency_ms: f.latencyMs,
      input_tokens: f.inputTokens,
      output_tokens: f.outputTokens,
      result: f.result as AiResult,
      error: f.error,
    });
    if (error) throw error;
  },
  async allowance(token) {
    const user = createClient(url, anonKey, { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data, error } = await user.rpc("ai_allowance").single();
    if (error) throw error;
    return data as Allowance;
  },
  foods() {
    foodCache ??= loadFoods().catch((e) => {
      foodCache = null;
      throw e;
    });
    return foodCache;
  },
  model: geminiModel(Deno.env.get("GEMINI_API_KEY") ?? "", modelName),
  modelName,
  now: () => performance.now(),
};

Deno.serve((req) => handle(req, deps));
