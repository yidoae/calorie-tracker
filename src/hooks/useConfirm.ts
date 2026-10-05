"use client";

import { useState } from "react";

/** State for a "are you sure?" dialog about one target (a meal, a plan…). */
export function useConfirm<T>() {
  const [target, setTarget] = useState<T | null>(null);
  return {
    target,
    open: target !== null,
    ask: (t: T) => setTarget(t),
    cancel: () => setTarget(null),
    /** Runs `action` with the target and closes the dialog. */
    confirm: (action: (t: T) => void) => {
      if (target !== null) action(target);
      setTarget(null);
    },
  };
}
