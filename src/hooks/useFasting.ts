"use client";

import { useEffect, useState } from "react";
import { DEFAULT_FASTING, fastingState, presetWindow } from "@/lib/nutrition/fasting";
import type { FastingPreset, FastingSettings } from "@/types/fasting";
import { useAuth } from "./useAuth";
import { useIsClient } from "./useIsClient";
import type { SensitiveWarning } from "./usePlanWizard";
import { planOn } from "@/lib/nutrition/schedule";

const TICK_MS = 1000;

/**
 * The intermittent-fasting card: saved window (on the account, so it survives reloads and other
 * devices), a once-a-second clock while it's on, and the content warning before switching it on
 * the first time. The phase itself is pure math on the local clock (lib/nutrition/fasting.ts).
 */
export function useFasting() {
  const { status, settings, updateSettings, requireAuth } = useAuth();
  const isClient = useIsClient();
  const plan = planOn(settings, new Date())?.inputs;
  // A 16:8 plan from the wizard already has a window: start from it.
  const config: FastingSettings =
    settings.fasting ??
    (plan?.mealPattern === "if168" ? { ...DEFAULT_FASTING, ...presetWindow("16:8", plan.fastingWindowStart * 60, 0) } : DEFAULT_FASTING);
  const [now, setNow] = useState(() => new Date());
  const [warning, setWarning] = useState<SensitiveWarning | null>(null);
  const ticking = isClient && config.enabled;

  useEffect(() => {
    if (!ticking) return;
    const timer = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(timer);
  }, [ticking]);

  const save = (patch: Partial<FastingSettings>) => updateSettings((current) => ({ ...current, fasting: { ...config, ...patch } }));

  const enable = () => updateSettings((current) => ({ ...current, sensitiveWarningAck: true, fasting: { ...config, enabled: true } }));

  return {
    ready: isClient && status !== "loading",
    config,
    state: ticking ? fastingState(now, config) : null,
    /** Minutes after local midnight right now (for the dial marker). */
    minuteNow: now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60,
    /** IANA zone the timer runs in, e.g. "Europe/Istanbul" (the browser's own setting). */
    timeZone: isClient ? Intl.DateTimeFormat().resolvedOptions().timeZone : null,
    setEnabled: (on: boolean) => {
      if (!on) return save({ enabled: false });
      requireAuth(() => {
        if (settings.sensitiveWarningAck) enable();
        else setWarning({ kind: "fasting" });
      });
    },
    setPreset: (preset: FastingPreset) => save({ preset, ...presetWindow(preset, config.eatStart, config.eatEnd) }),
    /** New start; presets keep their length, a custom window keeps its end. */
    setStart: (minutes: number) => {
      const window = presetWindow(config.preset, minutes, config.eatEnd);
      if (window.eatStart !== window.eatEnd) save(window);
    },
    setEnd: (minutes: number) => {
      if (config.preset === "custom" && minutes !== config.eatStart) save({ eatEnd: minutes });
    },
    warning,
    acceptWarning: () => {
      setWarning(null);
      enable();
    },
    declineWarning: () => setWarning(null),
  };
}

export type FastingApi = ReturnType<typeof useFasting>;
