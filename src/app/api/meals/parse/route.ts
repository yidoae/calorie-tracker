import { getCurrentUser } from "@/server/auth";
import { readJson, unauthorized } from "@/server/http";
import { parseQuickEntry } from "@/server/food/quickEntry";
import { quickParseRequestSchema } from "@/types/meal";

/**
 * POST /api/meals/parse { text }: quick-bar parsing. Returns `{ name, items, unmatched, aiMatched }`:
 * the rule-based parser's items plus whatever the local LLM could match. Nothing is saved.
 */
export async function POST(request: Request) {
  if (!(await getCurrentUser())) return unauthorized();
  const body = await readJson(request, quickParseRequestSchema);
  if (!body.ok) return body.response;
  return Response.json(await parseQuickEntry(body.data.text));
}
