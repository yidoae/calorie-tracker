import type { z } from "zod";

/*
 * Helpers shared by the Route Handlers in app/api. Every error response has the same shape,
 * `{ error: string }` (types/api.ts), with a Turkish message the client can show as-is.
 */

export function apiError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

export const unauthorized = () => apiError("Devam etmek için giriş yapın.", 401);

type Parsed<T> = { ok: true; data: T } | { ok: false; response: Response };

/** Validates a value against a schema; on failure, a 400 with the first issue's message. */
export function validate<T>(schema: z.ZodType<T>, value: unknown): Parsed<T> {
  const result = schema.safeParse(value);
  if (result.success) return { ok: true, data: result.data };
  const issue = result.error.issues[0];
  const where = issue?.path.length ? ` (${issue.path.join(".")})` : "";
  return { ok: false, response: apiError(`${issue?.message ?? "Geçersiz istek"}${where}`, 400) };
}

/** Reads and validates a JSON body. */
export async function readJson<T>(request: Request, schema: z.ZodType<T>): Promise<Parsed<T>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { ok: false, response: apiError("Geçerli bir JSON gövdesi bekleniyordu", 400) };
  }
  return validate(schema, body);
}
