import { getCurrentUser } from "@/server/auth";
import { readJson, unauthorized, validate } from "@/server/http";
import { listWater, logWater } from "@/server/tracking/repository";
import { dateRangeSchema } from "@/types/meal";
import { logWaterSchema } from "@/types/tracking";

/** GET /api/water?from=<ISO>&to=<ISO>: water entries in the client's local-day range, newest first. */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const params = new URL(request.url).searchParams;
  const range = validate(dateRangeSchema, { from: params.get("from"), to: params.get("to") });
  if (!range.ok) return range.response;
  return Response.json(await listWater(user.id, new Date(range.data.from), new Date(range.data.to)));
}

/** POST /api/water { ml }: logs a drink. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await readJson(request, logWaterSchema);
  if (!body.ok) return body.response;
  return Response.json(await logWater(user.id, body.data.ml), { status: 201 });
}
