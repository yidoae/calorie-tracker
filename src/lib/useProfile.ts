"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { isValidCustomPlan, type CustomPlan } from "./customPlan";
import { isValidProfile, type Profile } from "./profile";

const STORAGE_KEY = "calorie-tracker:profiles-v2";
/** Single-profile format from before multi-profile support; migrated on first read. */
const LEGACY_KEY = "calorie-tracker:profile";

interface StoredState {
  profiles: Profile[];
  activeProfileId: string | null;
  customPlan: CustomPlan | null;
}

const EMPTY_STATE: StoredState = { profiles: [], activeProfileId: null, customPlan: null };

const listeners = new Set<() => void>();
// Keeps things working for this session if localStorage is unavailable (e.g. private mode).
let memoryCopy: string | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener); // changes from other tabs
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? memoryCopy;
  } catch {
    return memoryCopy;
  }
}

/** Reads the old single-profile format, if present, without persisting anything. */
function migrateLegacy(): StoredState | null {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const legacy = JSON.parse(raw) as Partial<Profile>;
    const profile: Profile = {
      id: "legacy",
      label: "My plan",
      gender: legacy.gender as Profile["gender"],
      heightCm: legacy.heightCm as number,
      weightKg: legacy.weightKg as number,
      age: legacy.age as number,
      activity: legacy.activity as Profile["activity"],
      targetWeightKg: null,
      paceGoal: "moderate",
      trainingType: "rest",
    };
    if (!isValidProfile(profile)) return null;
    return { profiles: [profile], activeProfileId: profile.id, customPlan: null };
  } catch {
    return null;
  }
}

function parseState(raw: string): StoredState {
  try {
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    const profiles = Array.isArray(parsed.profiles) ? parsed.profiles.filter(isValidProfile) : [];
    const activeProfileId = profiles.some((p) => p.id === parsed.activeProfileId)
      ? (parsed.activeProfileId as string)
      : (profiles[0]?.id ?? null);
    const customPlan = isValidCustomPlan((parsed.customPlan ?? {}) as CustomPlan) ? (parsed.customPlan as CustomPlan) : null;
    return { profiles, activeProfileId, customPlan };
  } catch {
    return EMPTY_STATE;
  }
}

function currentState(): StoredState {
  const raw = readRaw();
  if (raw) return parseState(raw);
  return migrateLegacy() ?? EMPTY_STATE;
}

function getSnapshot(): string {
  const raw = readRaw();
  if (raw) return raw;
  return JSON.stringify(migrateLegacy() ?? EMPTY_STATE);
}

const getServerSnapshot = () => JSON.stringify(EMPTY_STATE);

function persist(state: StoredState) {
  memoryCopy = JSON.stringify(state);
  try {
    localStorage.setItem(STORAGE_KEY, memoryCopy);
  } catch {
    // fall back to the in-memory copy
  }
  listeners.forEach((listener) => listener());
}

/** Saved profiles (plans), the active one, and an optional custom plan that overrides it. */
export function useProfile() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const state = useMemo(() => parseState(raw), [raw]);
  const activeProfile = useMemo(
    () => state.profiles.find((p) => p.id === state.activeProfileId) ?? null,
    [state],
  );

  const saveProfile = useCallback((profile: Profile) => {
    const current = currentState();
    const exists = current.profiles.some((p) => p.id === profile.id);
    const profiles = exists
      ? current.profiles.map((p) => (p.id === profile.id ? profile : p))
      : [...current.profiles, profile];
    persist({ ...current, profiles, activeProfileId: profile.id });
  }, []);

  const deleteProfile = useCallback((id: string) => {
    const current = currentState();
    const profiles = current.profiles.filter((p) => p.id !== id);
    const activeProfileId = current.activeProfileId === id ? (profiles[0]?.id ?? null) : current.activeProfileId;
    persist({ ...current, profiles, activeProfileId });
  }, []);

  const setActiveProfileId = useCallback((id: string) => {
    const current = currentState();
    if (!current.profiles.some((p) => p.id === id)) return;
    persist({ ...current, activeProfileId: id });
  }, []);

  const saveCustomPlan = useCallback((plan: CustomPlan) => {
    persist({ ...currentState(), customPlan: plan });
  }, []);

  const clearCustomPlan = useCallback(() => {
    persist({ ...currentState(), customPlan: null });
  }, []);

  return {
    profiles: state.profiles,
    activeProfile,
    customPlan: state.customPlan,
    saveProfile,
    deleteProfile,
    setActiveProfileId,
    saveCustomPlan,
    clearCustomPlan,
  };
}
