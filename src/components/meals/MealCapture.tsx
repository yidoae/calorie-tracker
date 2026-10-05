"use client";

import { Camera, ImagePlus, Loader2, ScanBarcode, TriangleAlert, X } from "lucide-react";
import { useRef } from "react";
import { useBarcodeEntry } from "@/hooks/useBarcodeEntry";
import { useMealCapture } from "@/hooks/useMealCapture";
import Reveal from "../ui/Reveal";
import BarcodeScanner from "./BarcodeScanner";
import CameraView from "./CameraView";
import MealReview from "./MealReview";

/**
 * "Fotoğraf çek" / "Yükle" / "Barkod" buttons and the flows they start: camera → analysis →
 * portion review, or barcode → product lookup → portion review.
 */
export default function MealCapture() {
  const nativeCameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const capture = useMealCapture({ nativeCameraRef, galleryRef });
  const barcode = useBarcodeEntry();
  const { phase } = capture;
  const uploading = phase.kind === "analyzing" && phase.source === "upload";
  const barcodeOpen = barcode.phase.kind !== "closed";
  const busy = capture.busy || barcodeOpen;

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

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] sm:gap-3">
        <button type="button" disabled={busy} onClick={capture.openCamera} className="btn btn-primary btn-lg col-span-2 px-3 sm:col-span-1">
          {uploading ? <Loader2 aria-hidden className="size-[18px] animate-spin" /> : <Camera aria-hidden className="size-[18px]" />}
          {uploading ? "Analiz ediliyor…" : "Fotoğraf çek"}
        </button>
        <button type="button" disabled={busy} onClick={capture.openGallery} className="btn btn-soft btn-lg px-3">
          <ImagePlus aria-hidden className="size-[18px]" />
          Yükle
        </button>
        <button type="button" disabled={busy} onClick={barcode.open} className="btn btn-soft btn-lg px-3">
          <ScanBarcode aria-hidden className="size-[18px]" />
          Barkod
        </button>
      </div>

      <Reveal show={barcode.phase.kind === "scanning" || barcode.phase.kind === "looking"} className="-mx-1 px-1">
        {() => (
          <div className="pt-3">
            <BarcodeScanner
              looking={barcode.phase.kind === "looking"}
              notice={barcode.notice}
              manual={barcode.manual}
              manualValid={barcode.manualValid}
              onManualChange={barcode.setManual}
              onSubmitManual={barcode.submitManual}
              onDetected={barcode.onDetected}
              onClose={barcode.close}
            />
          </div>
        )}
      </Reveal>

      <Reveal show={barcode.phase.kind === "review" || barcode.phase.kind === "saving"} className="-mx-1 px-1">
        {() =>
          (barcode.phase.kind === "review" || barcode.phase.kind === "saving") && (
            <div className="pt-3">
              <MealReview
                draft={barcode.phase.draft}
                saving={barcode.phase.kind === "saving"}
                onSave={(meal) => void barcode.save(meal)}
                onDiscard={barcode.close}
                title={barcode.phase.product.name}
                subtitle={`${barcode.phase.product.brand ? `${barcode.phase.product.brand} · ` : ""}${barcode.phase.product.per100g.calories} kcal / 100 g. Porsiyonu ayarla, sonra kaydet.`}
              />
            </div>
          )
        }
      </Reveal>

      <Reveal show={uploading} className="-mx-1 px-1">
        {() => (
          <div className="pt-3">
            <div role="status" aria-busy="true" className="card space-y-3 p-4">
              <p className="text-[13px] text-fg-muted">Tabağındaki bileşenler ayrıştırılıyor…</p>
              <div className="skeleton h-16 w-full" />
              <div className="skeleton h-16 w-full" />
            </div>
          </div>
        )}
      </Reveal>

      <Reveal show={capture.cameraOpen} className="-mx-1 px-1">
        {() => (
          <div className="pt-3">
            <div className="card scroll-mt-16 space-y-3 p-3">
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
          </div>
        )}
      </Reveal>

      <Reveal show={phase.kind === "review" || phase.kind === "saving"} className="-mx-1 px-1">
        {() =>
          (phase.kind === "review" || phase.kind === "saving") && (
            <div className="pt-3">
              <MealReview
                image={phase.image}
                draft={phase.draft}
                saving={phase.kind === "saving"}
                onSave={(meal) => void capture.save(meal)}
                onDiscard={capture.discard}
              />
            </div>
          )
        }
      </Reveal>

      <Reveal show={capture.notice !== null} className="-mx-1 px-1">
        {() =>
          capture.notice && (
            <div className="pt-3">
              <p role="alert" className={`alert ${capture.notice.warning ? "alert-warning" : "alert-danger"}`}>
                <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
                {capture.notice.message}
              </p>
            </div>
          )
        }
      </Reveal>
    </div>
  );
}
