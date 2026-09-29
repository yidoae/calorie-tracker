"use client";

import { Camera, ImagePlus, Loader2, TriangleAlert, X } from "lucide-react";
import { useRef } from "react";
import { useMealCapture } from "@/hooks/useMealCapture";
import CameraView from "./CameraView";
import MealReview from "./MealReview";

/** "Fotoğraf çek" / "Yükle" buttons and the flow they start: camera → analysis → portion review. */
export default function MealCapture() {
  const nativeCameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const capture = useMealCapture({ nativeCameraRef, galleryRef });
  const { phase } = capture;
  const uploading = phase.kind === "analyzing" && phase.source === "upload";

  return (
    <div>
      {/* Fallback when the live camera is unavailable: `capture` opens the camera app on phones. */}
      <input
        ref={nativeCameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => capture.onFileChosen(e.currentTarget)}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => capture.onFileChosen(e.currentTarget)}
      />

      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-2 sm:gap-3">
        <button type="button" disabled={capture.busy} onClick={capture.openCamera} className="btn btn-primary btn-lg">
          {uploading ? <Loader2 aria-hidden className="size-[18px] animate-spin" /> : <Camera aria-hidden className="size-[18px]" />}
          {uploading ? "Analiz ediliyor…" : "Fotoğraf çek"}
        </button>
        <button type="button" disabled={capture.busy} onClick={capture.openGallery} className="btn btn-soft btn-lg">
          <ImagePlus aria-hidden className="size-[18px]" />
          Yükle
        </button>
      </div>

      {uploading && (
        <div role="status" aria-busy="true" className="card mt-3 animate-enter space-y-3 p-4">
          <p className="text-[13px] text-fg-muted">Tabağındaki bileşenler ayrıştırılıyor…</p>
          <div className="skeleton h-16 w-full" />
          <div className="skeleton h-16 w-full" />
        </div>
      )}

      {capture.cameraOpen && (
        <div className="card mt-3 animate-enter scroll-mt-16 space-y-3 p-3">
          <div className="flex min-h-8 items-center justify-between pl-1">
            <h2 className="section-title flex items-center gap-2">
              <span aria-hidden className="size-2 animate-pulse rounded-full bg-danger" />
              Canlı kamera
            </h2>
            {phase.kind === "camera" && (
              <button type="button" aria-label="Kamerayı kapat" onClick={capture.closeCamera} className="btn btn-ghost btn-icon-sm">
                <X aria-hidden className="size-4" />
              </button>
            )}
          </div>
          <CameraView onCapture={capture.captureFromCamera} analyzing={phase.kind === "analyzing"} />
        </div>
      )}

      {(phase.kind === "review" || phase.kind === "saving") && (
        <div className="mt-3 animate-enter">
          <MealReview
            image={phase.image}
            draft={phase.draft}
            saving={phase.kind === "saving"}
            onSave={(meal) => void capture.save(meal)}
            onDiscard={capture.discard}
          />
        </div>
      )}

      {capture.notice && (
        <p role="alert" className={`alert mt-3 animate-enter ${capture.notice.warning ? "alert-warning" : "alert-danger"}`}>
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          {capture.notice.message}
        </p>
      )}
    </div>
  );
}
