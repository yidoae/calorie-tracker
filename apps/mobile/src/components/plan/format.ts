import { LOCALE } from "@calorie/core/dates";

/** A weekly weight change: "−0,45 kg", "+0,23 kg" or "Denge". */
export function formatWeeklyChange(kg: number): string {
  if (kg === 0) return "Denge";
  return `${kg > 0 ? "+" : "−"}${Math.abs(kg).toLocaleString(LOCALE, { maximumFractionDigits: 2 })} kg`;
}

/** A 16:8 eating window from its first hour: "12:00–20:00". */
export function formatWindow(start: number): string {
  const hour = (h: number) => `${String(h).padStart(2, "0")}:00`;
  return `${hour(start)}–${hour(start + 8)}`;
}
