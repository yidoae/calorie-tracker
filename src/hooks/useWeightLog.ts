"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { dayKey } from "@/lib/dates";
import { weeklyRate, weeksToTarget, weightTrend } from "@/lib/nutrition/weight";
import { errorMessage } from "@/services/http";
import { trackingService } from "@/services/trackingService";
import { WEIGHT_LIMITS, type WeightEntry } from "@/types/tracking";
import { useAuth } from "./useAuth";
import { useToast } from "./useToast";
import { planOn } from "@/lib/nutrition/schedule";

const CHART_POINTS = 60;

/**
 * Weigh-ins: today's entry form, the trend line (7-day average), the weekly rate and the weeks
 * left to the plan's target weight at that rate.
 */
export function useWeightLog() {
  const { user, settings, requireAuth } = useAuth();
  const toast = useToast();
  const [state, setState] = useState<{ userId: string; entries: WeightEntry[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    trackingService
      .weights()
      .then((entries) => {
        if (cancelled) return;
        setState({ userId: user.id, entries });
        setError(null);
      })
      .catch((err: unknown) => !cancelled && setError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [user]);

  const entries = useMemo(() => (user && state?.userId === user.id ? state.entries : []), [user, state]);
  const points = useMemo(() => weightTrend(entries).slice(-CHART_POINTS), [entries]);
  const rate = useMemo(() => weeklyRate(entries), [entries]);
  const latest = points.at(-1) ?? null;
  const target = planOn(settings, new Date())?.inputs.targetWeightKg ?? null;
  const weeksLeft = latest && target !== null ? weeksToTarget(latest.trend, target, rate) : null;

  const kg = Number(input.replace(",", "."));
  const inputValid = input.trim() !== "" && Number.isFinite(kg) && kg >= WEIGHT_LIMITS.min && kg <= WEIGHT_LIMITS.max;

  const submit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (!inputValid) return;
      requireAuth(() => {
        setSaving(true);
        trackingService
          .logWeight({ day: dayKey(new Date()), kg })
          .then((entry) => {
            setState((s) => (s ? { ...s, entries: [entry, ...s.entries.filter((x) => x.day !== entry.day)] } : s));
            setInput("");
            toast.success(`${entry.kg.toLocaleString("tr-TR")} kg kaydedildi`);
          })
          .catch((err: unknown) => toast.error("Kilo kaydedilemedi", errorMessage(err)))
          .finally(() => setSaving(false));
      });
    },
    [inputValid, kg, requireAuth, toast],
  );

  const remove = useCallback(
    async (entry: WeightEntry) => {
      try {
        await trackingService.removeWeight(entry.id);
        setState((s) => (s ? { ...s, entries: s.entries.filter((x) => x.id !== entry.id) } : s));
        toast.success("Kayıt silindi");
      } catch (err) {
        toast.error("Kayıt silinemedi", errorMessage(err));
      }
    },
    [toast],
  );

  return {
    signedIn: user !== null,
    loading: user !== null && state?.userId !== user.id && error === null,
    error,
    points,
    latest,
    rate,
    target,
    weeksLeft,
    loggedToday: entries.some((e) => e.day === dayKey(new Date())),
    input,
    setInput,
    inputValid,
    inputError: input.trim() !== "" && !inputValid,
    saving,
    submit,
    remove,
    lastEntry: entries[0] ?? null,
  };
}
