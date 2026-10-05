"use client";

import { Loader2, Search, TriangleAlert, X } from "lucide-react";
import { useRef, type FormEvent } from "react";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";

interface Props {
  looking: boolean;
  notice: string | null;
  manual: string;
  manualValid: boolean;
  onManualChange: (value: string) => void;
  onSubmitManual: (e: FormEvent) => void;
  onDetected: (barcode: string) => void;
  onClose: () => void;
}

/** Live barcode scanner with a manual entry fallback. Unmounting it releases the camera. */
export default function BarcodeScanner({ looking, notice, manual, manualValid, onManualChange, onSubmitManual, onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanner = useBarcodeScanner(videoRef, onDetected);

  return (
    <div className="card space-y-3 p-3">
      <div className="flex min-h-8 items-center justify-between pl-1">
        <h2 className="section-title">Barkod okut</h2>
        <button type="button" aria-label="Barkod okuyucuyu kapat" onClick={onClose} className="btn btn-ghost btn-icon-sm">
          <X aria-hidden className="size-4" />
        </button>
      </div>

      {!scanner.errorMessage && (
        <div className="relative aspect-[4/3] overflow-hidden rounded-[6px] bg-ink">
          <video ref={videoRef} muted playsInline className="size-full object-cover" />
          {/* Aiming frame: barcodes are wide and short. */}
          <span aria-hidden className="absolute inset-x-8 top-1/2 h-24 -translate-y-1/2 rounded-[6px] border-2 border-cta" />
          {(!scanner.scanning || looking) && (
            <div role="status" className="absolute inset-0 flex items-center justify-center gap-2 bg-ink/60 text-sm text-on-ink">
              <Loader2 aria-hidden className="size-4 animate-spin" />
              {looking ? "Ürün aranıyor…" : "Kamera açılıyor…"}
            </div>
          )}
        </div>
      )}
      {scanner.errorMessage && (
        <p role="alert" className="alert alert-warning">
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          {scanner.errorMessage}
        </p>
      )}
      {scanner.scanning && !looking && <p className="px-1 text-xs text-fg-muted">Paketin üzerindeki barkodu çerçevenin içine getir.</p>}

      <form onSubmit={onSubmitManual} className="flex gap-2">
        <label htmlFor="barcode-manual" className="sr-only">
          Barkod numarası
        </label>
        <input
          id="barcode-manual"
          value={manual}
          onChange={(e) => onManualChange(e.target.value)}
          inputMode="numeric"
          autoComplete="off"
          placeholder="Barkodu elle yaz (8–14 hane)"
          className="input"
        />
        <button type="submit" disabled={!manualValid || looking} className="btn btn-secondary h-10">
          {looking ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Search aria-hidden className="size-4" />}
          Ara
        </button>
      </form>

      {notice && (
        <p role="alert" className="alert alert-danger">
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          {notice}
        </p>
      )}
      <p className="px-1 text-xs text-fg-subtle">Ürün bilgileri Open Food Facts açık veritabanından gelir; yalnızca barkod numarası gönderilir.</p>
    </div>
  );
}
