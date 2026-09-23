"use client";

import { Camera, ImagePlus, Loader2, TriangleAlert, X } from "lucide-react";
import { useRef, useState } from "react";
import type { MealDTO } from "@/lib/types";
import CameraCapture from "./CameraCapture";
import MealReviewCard, { type MealDraft, type ReviewedMeal } from "./MealReviewCard";

interface Props {
  onMealAdded: (meal: MealDTO) => void;
}

type Phase =
  | { kind: "idle" }
  | { kind: "camera" }
  | { kind: "analyzing"; source: "camera" | "upload" }
  | { kind: "review"; image: Blob; draft: MealDraft }
  | { kind: "saving"; image: Blob; draft: MealDraft };

export default function MealUploader({ onMealAdded }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  // A "warning" is a photo that was analyzed but isn't a meal (422), as opposed to a failure.
  const [notice, setNotice] = useState<{ message: string; warning: boolean } | null>(null);

  async function analyze(image: Blob, source: "camera" | "upload") {
    setNotice(null);
    setPhase({ kind: "analyzing", source });
    try {
      const body = new FormData();
      body.append("image", image, image instanceof File ? image.name : "capture.jpg");
      const res = await fetch("/api/meals/analyze", { method: "POST", body });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setPhase({ kind: "idle" });
        setNotice({ message: json?.error ?? "Something went wrong", warning: res.status === 422 });
        return;
      }
      setPhase({ kind: "review", image, draft: json as MealDraft });
    } catch {
      setPhase({ kind: "idle" });
      setNotice({ message: "Something went wrong", warning: false });
    }
  }

  async function confirmSave(image: Blob, reviewed: ReviewedMeal) {
    setPhase((prev) => (prev.kind === "review" ? { kind: "saving", image, draft: prev.draft } : prev));
    try {
      const body = new FormData();
      body.append("image", image, image instanceof File ? image.name : "capture.jpg");
      body.append("name", reviewed.name);
      body.append("calories", String(reviewed.calories));
      body.append("protein", String(reviewed.protein));
      body.append("carbs", String(reviewed.carbs));
      body.append("fat", String(reviewed.fat));
      const res = await fetch("/api/meals", { method: "POST", body });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setNotice({ message: json?.error ?? "Something went wrong", warning: false });
        setPhase({ kind: "idle" });
        return;
      }
      onMealAdded(json as MealDTO);
      setPhase({ kind: "idle" });
    } catch {
      setNotice({ message: "Something went wrong", warning: false });
      setPhase({ kind: "idle" });
    }
  }

  function discard() {
    setPhase({ kind: "idle" });
  }

  function handleFile(input: HTMLInputElement) {
    const file = input.files?.[0];
    input.value = ""; // allow picking the same file again later
    if (file) void analyze(file, "upload");
  }

  function openCamera() {
    // getUserMedia only exists in secure contexts (https/localhost). Elsewhere, e.g. a phone
    // opening the dev server over http on the LAN, fall back to the native camera app.
    setNotice(null);
    if (typeof navigator.mediaDevices?.getUserMedia === "function") setPhase({ kind: "camera" });
    else cameraRef.current?.click();
  }

  const cameraOpen = phase.kind === "camera" || (phase.kind === "analyzing" && phase.source === "camera");
  const analyzing = phase.kind === "analyzing";
  const busy = phase.kind !== "idle";

  const buttonBase =
    "flex h-12 items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:opacity-60";

  return (
    <div>
      {/* Fallback when the live camera is unavailable: `capture` opens the camera app on phones. */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.currentTarget)}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => handleFile(e.currentTarget)}
      />

      <div className="grid grid-cols-[2fr_1fr] gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={openCamera}
          className={`${buttonBase} bg-emerald-600 text-white hover:bg-emerald-700`}
        >
          {phase.kind === "analyzing" && phase.source === "upload" ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Camera className="size-5" />
          )}
          {phase.kind === "analyzing" && phase.source === "upload" ? "Analyzing…" : "Snap a meal"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => galleryRef.current?.click()}
          className={`${buttonBase} border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800`}
        >
          <ImagePlus className="size-5" />
          Upload
        </button>
      </div>

      {cameraOpen && (
        <div className="mt-3 space-y-3 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Live camera</h2>
            {phase.kind === "camera" && (
              <button
                type="button"
                aria-label="Close camera"
                onClick={() => setPhase({ kind: "idle" })}
                className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="size-5" />
              </button>
            )}
          </div>
          <CameraCapture onCapture={(image) => void analyze(image, "camera")} analyzing={analyzing} />
        </div>
      )}

      {(phase.kind === "review" || phase.kind === "saving") && (
        <div className="mt-3">
          <MealReviewCard
            image={phase.image}
            draft={phase.draft}
            saving={phase.kind === "saving"}
            onSave={(reviewed) => void confirmSave(phase.image, reviewed)}
            onDiscard={discard}
          />
        </div>
      )}

      {notice && (
        <p
          role="alert"
          className={`mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${
            notice.warning
              ? "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
              : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
          }`}
        >
          {notice.warning && <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />}
          {notice.message}
        </p>
      )}
    </div>
  );
}
