"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { parseProfile, type Profile } from "./profile";

const STORAGE_KEY = "calorie-tracker:profile";

const listeners = new Set<() => void>();
// Keeps the profile working for this session if localStorage is unavailable (e.g. private mode).
let memoryCopy: string | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener); // changes from other tabs
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function getSnapshot(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? memoryCopy;
  } catch {
    return memoryCopy;
  }
}

const getServerSnapshot = () => null;

/** The saved profile (null until set, and during server render) plus a setter. */
export function useProfile() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const profile = useMemo(() => parseProfile(raw), [raw]);

  const saveProfile = useCallback((next: Profile) => {
    memoryCopy = JSON.stringify(next);
    try {
      localStorage.setItem(STORAGE_KEY, memoryCopy);
    } catch {
      // fall back to the in-memory copy
    }
    listeners.forEach((listener) => listener());
  }, []);

  return { profile, saveProfile };
}
