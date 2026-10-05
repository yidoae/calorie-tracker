"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { getFood } from "@/lib/nutrition/foods";
import { totalOfItems } from "@/lib/nutrition/macros";
import { quickParse } from "@/lib/nutrition/quickParse";
import { slotForHour } from "@/lib/nutrition/slots";
import { errorMessage } from "@/services/http";
import { mealService } from "@/services/mealService";
import type { QuickParseResult } from "@/types/meal";
import { useAuth } from "./useAuth";
import { invalidateMeals } from "./useMeals";
import { useToast } from "./useToast";

const AI_DEBOUNCE_MS = 700;
const MIN_CHARS = 2;

/**
 * The natural-language quick bar. Every keystroke is parsed locally (instant preview); when some
 * words aren't recognised, the server is asked (debounced) to match them with the local AI.
 * Submitting logs the meal without a photo.
 */
export function useQuickEntry() {
  const { status, requireAuth } = useAuth();
  const toast = useToast();
  const [text, setText] = useState("");
  const [aiResult, setAiResult] = useState<{ text: string; result: QuickParseResult } | null>(null);
  const [aiPendingFor, setAiPendingFor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const trimmed = text.trim();
  const local = useMemo(() => (trimmed.length >= MIN_CHARS ? quickParse(trimmed, getFood) : null), [trimmed]);
  const needsAi = status === "user" && local !== null && local.unmatched.length > 0;

  useEffect(() => {
    if (!needsAi || aiResult?.text === trimmed) return;
    const timer = setTimeout(() => {
      setAiPendingFor(trimmed);
      mealService
        .parse(trimmed)
        .then((result) => setAiResult({ text: trimmed, result }))
        .catch(() => setAiResult(null)) // keep the local result; unmatched words stay flagged
        .finally(() => setAiPendingFor((t) => (t === trimmed ? null : t)));
    }, AI_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [needsAi, trimmed, aiResult?.text]);

  const result = aiResult?.text === trimmed ? aiResult.result : local;
  const totals = useMemo(() => (result ? totalOfItems(result.items) : null), [result]);
  const canSave = !saving && result !== null && result.items.length > 0;

  async function save() {
    if (!result || result.items.length === 0) return;
    setSaving(true);
    try {
      const slot = result.slot ?? slotForHour(new Date().getHours());
      const saved = await mealService.create({ name: result.name, slot, items: result.items });
      toast.success(`"${saved.name}" kaydedildi`, `${saved.calories} kcal günlüğüne eklendi.`);
      setText("");
      setAiResult(null);
      invalidateMeals();
    } catch (err) {
      toast.error("Öğün kaydedilemedi", errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!result || result.items.length === 0) {
      if (trimmed) toast.info("Tanınan bir besin yok", "Örn. \"200 g tavuk, 1 kase pilav\" gibi yazmayı dene.");
      return;
    }
    requireAuth(() => void save());
  }

  return {
    text,
    setText,
    result,
    totals,
    aiPending: aiPendingFor === trimmed && needsAi,
    saving,
    canSave,
    submit,
    clear: () => setText(""),
  };
}
