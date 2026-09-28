"use client";

import { Camera, ImagePlus, Loader2, TriangleAlert, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { MealDTO } from "@/lib/types";
import CameraCapture from "./CameraCapture";
import MealReviewCard, { type MealDraft, type ReviewedMeal } from "./MealReviewCard";

interface Props {
  onMealAdded: (meal: MealDTO) => void;
}

const MAX_PHOTO_EDGE = 1600;
const PASSTHROUGH_BYTES = 3 * 1024 * 1024;
const SERVER_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * Phone camera photos are often 12+ MP (can exceed the server's 10 MB cap) or HEIC, which the
 * server rejects. Re-encode anything big or unsupported to a downscaled JPEG; small supported
 * files (and GIFs) are sent untouched. Falls back to the original if the browser can't decode it.
 */
async function preparePhoto(file: File): Promise<Blob> {
  if (file.type === "image/gif" || (SERVER_TYPES.includes(file.type) && file.size <= PASSTHROUGH_BYTES)) return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_PHOTO_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    return blob ?? file;
  } catch {
    return file;
  }
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
  const cameraPanelRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });

  // On phones the panel can open below the fold, so it looks like nothing happened.
  useEffect(() => {
    if (phase.kind === "camera") cameraPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [phase.kind]);
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
    if (file) void preparePhoto(file).then((photo) => analyze(photo, "upload"));
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

      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-2 sm:gap-3">
        <button type="button" disabled={busy} onClick={openCamera} className="btn btn-primary btn-lg">
          {phase.kind === "analyzing" && phase.source === "upload" ? (
            <Loader2 aria-hidden className="size-[18px] animate-spin" />
          ) : (
            <Camera aria-hidden className="size-[18px]" />
          )}
          {phase.kind === "analyzing" && phase.source === "upload" ? "Analyzing…" : "Snap a meal"}
        </button>
        <button type="button" disabled={busy} onClick={() => galleryRef.current?.click()} className="btn btn-secondary btn-lg">
          <ImagePlus aria-hidden className="size-[18px]" />
          Upload
        </button>
      </div>

      {cameraOpen && (
        <div ref={cameraPanelRef} className="card mt-3 animate-enter scroll-mt-16 space-y-3 p-3">
          <div className="flex min-h-8 items-center justify-between pl-1">
            <h2 className="section-title flex items-center gap-2">
              <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-danger" />
              Live camera
            </h2>
            {phase.kind === "camera" && (
              <button type="button" aria-label="Close camera" onClick={() => setPhase({ kind: "idle" })} className="btn btn-ghost btn-icon-sm">
                <X aria-hidden className="size-4" />
              </button>
            )}
          </div>
          <CameraCapture onCapture={(image) => void analyze(image, "camera")} analyzing={analyzing} />
        </div>
      )}

      {(phase.kind === "review" || phase.kind === "saving") && (
        <div className="mt-3 animate-enter">
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
          className={`mt-3 flex animate-enter items-start gap-2 rounded-lg border px-3 py-2.5 text-[13px] ${
            notice.warning ? "border-warning-text/20 bg-warning-soft text-warning-text" : "border-danger/20 bg-danger-soft text-danger-text"
          }`}
        >
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          {notice.message}
        </p>
      )}
    </div>
  );
}
