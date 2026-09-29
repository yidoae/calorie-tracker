/**
 * Tiny in-memory sliding-window limiter for auth endpoints (per process; enough for a single
 * Node server). Slows password guessing without locking the real user out for long.
 */
const hits = new Map<string, number[]>();

export function rateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 10_000) hits.clear(); // bound memory under abuse
  return recent.length > limit;
}

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}
