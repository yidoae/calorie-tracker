"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { defaultWaterGoal, filledGlasses, GLASS_ML, glassCount } from "@/lib/nutrition/water";
import { errorMessage } from "@/services/http";
import { trackingService } from "@/services/trackingService";
import { WATER_GOAL_RANGE } from "@/types/settings";
import type { WaterEntry } from "@/types/tracking";
import { useAuth } from "./useAuth";
import { useToast } from "./useToast";
import { planOn } from "@/lib/nutrition/schedule";

function todayRange(): { from: Date; to: Date } {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + 1);
  return { from, to };
}

/**
 * Today's water: entries, total against the goal, quick-add and undo of the last drink. The goal
 * is the user's own (settings) or the EFSA default for their sex from the active plan.
 */
export function useWater() {
  const { user, settings, updateSettings, requireAuth } = useAuth();
  const toast = useToast();
  const { from, to } = useMemo(() => todayRange(), []);
  const [state, setState] = useState<{ userId: string; entries: WaterEntry[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    trackingService
      .water(from, to)
      .then((entries) => {
        if (cancelled) return;
        setState({ userId: user.id, entries });
        setError(null);
      })
      .catch((err: unknown) => !cancelled && setError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [user, from, to]);

  const entries = useMemo(() => (user && state?.userId === user.id ? state.entries : []), [user, state]);
  const total = entries.reduce((sum, e) => sum + e.ml, 0);
  const goal = settings.waterGoalMl ?? defaultWaterGoal(planOn(settings, new Date())?.inputs.sex ?? null);

  const add = useCallback(
    (ml: number) =>
      requireAuth(() => {
        setBusy(true);
        trackingService
          .logWater(ml)
          .then((entry) => setState((s) => (s ? { ...s, entries: [entry, ...s.entries] } : s)))
          .catch((err: unknown) => toast.error("Su eklenemedi", errorMessage(err)))
          .finally(() => setBusy(false));
      }),
    [requireAuth, toast],
  );

  const undoLast = useCallback(async () => {
    const last = entries[0];
    if (!last) return;
    setBusy(true);
    try {
      await trackingService.removeWater(last.id);
      setState((s) => (s ? { ...s, entries: s.entries.filter((e) => e.id !== last.id) } : s));
      toast.info(`${last.ml} ml geri alındı`);
    } catch (err) {
      toast.error("Geri alınamadı", errorMessage(err));
    } finally {
      setBusy(false);
    }
  }, [entries, toast]);

  const setGoal = useCallback(
    (ml: number) => {
      const clamped = Math.min(WATER_GOAL_RANGE.max, Math.max(WATER_GOAL_RANGE.min, Math.round(ml / WATER_GOAL_RANGE.step) * WATER_GOAL_RANGE.step));
      updateSettings((current) => ({ ...current, waterGoalMl: clamped }));
    },
    [updateSettings],
  );

  return {
    signedIn: user !== null,
    loading: user !== null && state?.userId !== user.id && error === null,
    error,
    total,
    goal,
    progress: goal > 0 ? Math.min(1, total / goal) : 0,
    glasses: glassCount(goal),
    filled: filledGlasses(total),
    /**
     * Tapping glass `index` (0-based): an empty one fills the row up to it (one entry), the last
     * full one takes the last drink back.
     */
    tapGlass: (index: number) => {
      const filled = filledGlasses(total);
      if (index >= filled) add((index + 1 - filled) * GLASS_ML);
      else if (index === filled - 1) void undoLast();
    },
    reached: total >= goal,
    canUndo: entries.length > 0 && !busy,
    busy,
    add,
    undoLast,
    setGoal,
  };
}
