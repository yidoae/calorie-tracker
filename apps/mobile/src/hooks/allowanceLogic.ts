import type { Allowance } from "@calorie/core/schemas/ai";

/*
 * The daily AI allowance as the user sees it (003 FR-015). No React Native imports, so
 * tests/allowanceLogic.test.ts runs this under node.
 */

/** "Bugün 3 AI kaydın kaldı", or when it comes back; null while unknown. */
export function allowanceLine(allowance: Allowance | null, timeZone: string): string | null {
  if (!allowance) return null;
  const left = allowance.limit - allowance.used;
  if (left > 0) return `Bugün ${left} AI kaydın kaldı`;
  const time = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone }).format(new Date(allowance.resetsAt));
  return `Bugünlük AI hakkın bitti, ${time}'da yenilenir`;
}

/** Whether the analyse buttons are enabled; unknown counts allow it, since the server decides. */
export function canAnalyse(allowance: Allowance | null): boolean {
  return !allowance || allowance.used < allowance.limit;
}
