"use client";

import { useCallback, useState } from "react";
import type { MealDTO, UpdateMealInput } from "@/types/meal";
import { useMealActions } from "./useMeals";

/** Which meal is open in the edit dialog, and saving it. */
export function useMealEdit() {
  const { update } = useMealActions();
  const [editing, setEditing] = useState<MealDTO | null>(null);
  const [saving, setSaving] = useState(false);

  const save = useCallback(
    async (input: UpdateMealInput) => {
      if (!editing) return;
      setSaving(true);
      const ok = await update(editing.id, input);
      setSaving(false);
      if (ok) setEditing(null);
    },
    [editing, update],
  );

  return {
    editing,
    saving,
    open: (meal: MealDTO) => setEditing(meal),
    close: () => {
      if (!saving) setEditing(null);
    },
    save,
  };
}
