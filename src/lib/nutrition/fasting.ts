import type { FastingPreset, FastingSettings } from "@/types/fasting";

/*
 * Intermittent fasting on the local clock. The phase is always derived from the saved window and
 * the current time, so a reload (or another device) shows the same state; nothing is "started".
 * Dates are built with local calendar arithmetic, so daylight-saving shifts don't drift the window.
 */

export const MINUTES_PER_DAY = 1440;

/** Eating hours per preset ("custom" uses the saved start and end). */
export const PRESET_EATING_HOURS: Record<Exclude<FastingPreset, "custom">, number> = { "16:8": 8, "18:6": 6, "20:4": 4 };

export const DEFAULT_FASTING: FastingSettings = { enabled: false, preset: "16:8", eatStart: 12 * 60, eatEnd: 20 * 60 };

export type FastingPhase = "eating" | "fasting";

export interface FastingState {
  phase: FastingPhase;
  phaseStart: Date;
  phaseEnd: Date;
  remainingMs: number;
  /** 0–1 through the current phase. */
  progress: number;
  eatingMinutes: number;
  fastingMinutes: number;
}

const wrap = (minutes: number) => ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;

/** The window for a preset: it keeps the start and sets the end from the eating hours. */
export function presetWindow(preset: FastingPreset, eatStart: number, eatEnd: number): { eatStart: number; eatEnd: number } {
  if (preset === "custom") return { eatStart, eatEnd };
  return { eatStart, eatEnd: wrap(eatStart + PRESET_EATING_HOURS[preset] * 60) };
}

export const eatingMinutes = (s: Pick<FastingSettings, "eatStart" | "eatEnd">) => wrap(s.eatEnd - s.eatStart);

function isEating(minute: number, s: Pick<FastingSettings, "eatStart" | "eatEnd">): boolean {
  return s.eatStart < s.eatEnd ? minute >= s.eatStart && minute < s.eatEnd : minute >= s.eatStart || minute < s.eatEnd;
}

/** Local time `minutes` after midnight, `dayOffset` days from `now`'s date. */
const at = (now: Date, dayOffset: number, minutes: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, 0, minutes);

function nextAt(now: Date, minutes: number): Date {
  const today = at(now, 0, minutes);
  return today > now ? today : at(now, 1, minutes);
}

function previousAt(now: Date, minutes: number): Date {
  const today = at(now, 0, minutes);
  return today <= now ? today : at(now, -1, minutes);
}

export function fastingState(now: Date, s: Pick<FastingSettings, "eatStart" | "eatEnd">): FastingState {
  const minute = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const phase: FastingPhase = isEating(minute, s) ? "eating" : "fasting";
  const [startMinute, endMinute] = phase === "eating" ? [s.eatStart, s.eatEnd] : [s.eatEnd, s.eatStart];
  const phaseStart = previousAt(now, startMinute);
  const phaseEnd = nextAt(now, endMinute);
  const total = phaseEnd.getTime() - phaseStart.getTime();
  const eating = eatingMinutes(s);
  return {
    phase,
    phaseStart,
    phaseEnd,
    remainingMs: Math.max(0, phaseEnd.getTime() - now.getTime()),
    progress: total > 0 ? Math.min(1, Math.max(0, (now.getTime() - phaseStart.getTime()) / total)) : 0,
    eatingMinutes: eating,
    fastingMinutes: MINUTES_PER_DAY - eating,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "12:30" for minutes after midnight. */
export const formatMinuteOfDay = (minutes: number) => `${pad(Math.floor(wrap(minutes) / 60))}:${pad(wrap(minutes) % 60)}`;

/** "12:30" -> 750, or null for anything that isn't a valid HH:MM. */
export function parseMinuteOfDay(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [h, m] = [Number(match[1]), Number(match[2])];
  return h < 24 && m < 60 ? h * 60 + m : null;
}

/** "05:12:09" countdown text. */
export function formatCountdown(ms: number): string {
  const total = Math.floor(ms / 1000);
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

/** "16 sa" / "16 sa 30 dk". */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} sa ${m} dk` : `${h} sa`;
}
