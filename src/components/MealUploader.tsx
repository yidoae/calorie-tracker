"use client";

import { Camera, ImagePlus, Loader2, TriangleAlert, X } from "lucide-react";
import { useRef, useState } from "react";
import type { MealDTO } from "@/lib/types";
import CameraCapture from "./CameraCapture";

interface Props {
  onMealAdded: (meal: MealDTO) => void;
}

export default function MealUploader({ onMealAdded }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  // A "warning" is a photo that was analyzed but isn't a meal (422), as opposed to a failure.
  const [notice, setNotice] = useState<{ message: string; warning: boolean } | null>(null);

  async function analyze(image: Blob) {
    setAnalyzing(true);
    setNotice(null);
    try {
      const body = new FormData();
      body.append("image", image, image instanceof File ? image.name : "capture.jpg");
      const res = await fetch("/api/meals", { method: "POST", body });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setNotice({ message: json?.error ?? "Something went wrong", warning: res.status === 422 });
        return;
      }
      onMealAdded(json as MealDTO);
    } catch {
      setNotice({ message: "Something went wrong", warning: false });
    } finally {
      setAnalyzing(false);
    }
  }

  function handleFile(input: HTMLInputElement) {
    const file = input.files?.[0];
    input.value = ""; // allow picking the same file again later
    if (file) void analyze(file);
  }

  function openCamera() {
    // getUserMedia only exists in secure contexts (https/localhost). Elsewhere, e.g. a phone
    // opening the dev server over http on the LAN, fall back to the native camera app.
    setNotice(null);
    if (typeof navigator.mediaDevices?.getUserMedia === "function") setCameraOpen(true);
    else cameraRef.current?.click();
  }

  function handleCapture(image: Blob) {
    setCameraOpen(false);
    void analyze(image);
  }

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
          disabled={analyzing || cameraOpen}
          onClick={openCamera}
          className={`${buttonBase} bg-emerald-600 text-white hover:bg-emerald-700`}
        >
          {analyzing ? <Loader2 className="size-5 animate-spin" /> : <Camera className="size-5" />}
          {analyzing ? "Analyzing…" : "Snap a meal"}
        </button>
        <button
          type="button"
          disabled={analyzing}
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
            <button
              type="button"
              aria-label="Close camera"
              onClick={() => setCameraOpen(false)}
              className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="size-5" />
            </button>
          </div>
          <CameraCapture onCapture={handleCapture} />
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
