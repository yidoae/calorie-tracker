import { getCurrentUser } from "@/server/auth";
import { readJson, unauthorized } from "@/server/http";
import { listWeights, logWeight } from "@/server/tracking/repository";
import { logWeightSchema } from "@/types/tracking";

/** GET /api/weights: the user's weigh-ins, newest first. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  return Response.json(await listWeights(user.id));
}

/** POST /api/weights { day, kg }: logs (or replaces) the weigh-in for that local day. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await readJson(request, logWeightSchema);
  if (!body.ok) return body.response;
  return Response.json(await logWeight(user.id, body.data), { status: 201 });
}
