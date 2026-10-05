"use client";

import { useCallback, useState, type RefObject } from "react";
import { preparePhoto } from "@/lib/photo";
import { ApiError, errorMessage } from "@/services/http";
import { mealService } from "@/services/mealService";
import type { CreateMealInput, MealDraft } from "@/types/meal";
import { useAuth } from "./useAuth";
import { invalidateMeals } from "./useMeals";
import { useToast } from "./useToast";

export type CapturePhase =
  | { kind: "idle" }
  | { kind: "camera" }
  | { kind: "analyzing"; source: "camera" | "upload" }
  | { kind: "review"; image: Blob; draft: MealDraft }
  | { kind: "saving"; image: Blob; draft: MealDraft };

/** A notice under the buttons: `warning` = the photo isn't a meal (422), otherwise a failure. */
export interface CaptureNotice {
  message: string;
  warning: boolean;
}

/**
 * The photo flow: camera or file → vision analysis → portion review → save. Guests are stopped
 * by the auth guard and continue here after signing in.
 */
export function useMealCapture(inputs: {
  /** Hidden `<input capture>`: opens the phone's camera app when the live camera isn't available. */
  nativeCameraRef: RefObject<HTMLInputElement | null>;
  galleryRef: RefObject<HTMLInputElement | null>;
}) {
  const { nativeCameraRef, galleryRef } = inputs;
  const { requireAuth } = useAuth();
  const toast = useToast();
  const [phase, setPhase] = useState<CapturePhase>({ kind: "idle" });
  const [notice, setNotice] = useState<CaptureNotice | null>(null);

  const analyze = useCallback(async (image: Blob, source: "camera" | "upload") => {
    setNotice(null);
    setPhase({ kind: "analyzing", source });
    try {
      const draft = await mealService.analyze(image);
      setPhase({ kind: "review", image, draft });
    } catch (err) {
      setPhase({ kind: "idle" });
      setNotice({ message: errorMessage(err), warning: err instanceof ApiError && err.status === 422 });
    }
  }, []);

  const save = useCallback(
    async (meal: CreateMealInput) => {
      if (phase.kind !== "review") return;
      const { image, draft } = phase;
      setPhase({ kind: "saving", image, draft });
      try {
        const saved = await mealService.create(meal, image);
        setPhase({ kind: "idle" });
        toast.success(`"${saved.name}" kaydedildi`, `${saved.calories} kcal günlüğüne eklendi.`);
        invalidateMeals();
      } catch (err) {
        setPhase({ kind: "review", image, draft });
        toast.error("Öğün kaydedilemedi", errorMessage(err));
      }
    },
    [phase, toast],
  );

  const openCamera = useCallback(() => {
    requireAuth(() => {
      setNotice(null);
      // getUserMedia only exists in secure contexts (https/localhost). Elsewhere, e.g. a phone
      // opening the dev server over http on the LAN, fall back to the native camera app.
      if (typeof navigator.mediaDevices?.getUserMedia === "function") setPhase({ kind: "camera" });
      else nativeCameraRef.current?.click();
    });
  }, [requireAuth, nativeCameraRef]);

  const openGallery = useCallback(() => requireAuth(() => galleryRef.current?.click()), [requireAuth, galleryRef]);

  const onFileChosen = useCallback(
    (input: HTMLInputElement) => {
      const file = input.files?.[0];
      input.value = ""; // allow picking the same file again later
      if (file) void preparePhoto(file).then((photo) => analyze(photo, "upload"));
    },
    [analyze],
  );

  return {
    phase,
    notice,
    busy: phase.kind !== "idle",
    cameraOpen: phase.kind === "camera" || (phase.kind === "analyzing" && phase.source === "camera"),
    openCamera,
    openGallery,
    closeCamera: () => setPhase({ kind: "idle" }),
    onFileChosen,
    captureFromCamera: (image: Blob) => void analyze(image, "camera"),
    save,
    discard: () => setPhase({ kind: "idle" }),
  };
}
