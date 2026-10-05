"use client";

import { Aperture, Loader2, ScanLine } from "lucide-react";
import { useRef } from "react";
import { useCameraStream } from "@/hooks/useCameraStream";

interface Props {
  /** Receives the captured frame as a JPEG. */
  onCapture: (image: Blob) => void;
  /** True while the parent is sending the captured photo to the vision model. */
  analyzing: boolean;
}

/**
 * Live camera preview with a viewfinder, a shutter countdown and a capture button. Once captured
 * the frame freezes with a scanning-laser overlay until `analyzing` turns false.
 */
export default function CameraView({ onCapture, analyzing }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cam = useCameraStream(videoRef, onCapture);

  if (cam.errorMessage) {
    return (
      <p role="alert" className="rounded-[10px] border border-danger-text/30 bg-danger-soft px-4 py-6 text-center text-[13px] text-danger-text">
        {cam.errorMessage}
      </p>
    );
  }

  const busy = cam.frozenFrame !== null && analyzing;

  return (
    <div className="space-y-3">
      <div className="relative min-h-64 overflow-hidden rounded-[10px] bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onPlaying={cam.onPlaying}
          className={`block max-h-[60dvh] w-full object-contain ${busy ? "invisible" : ""}`}
        />

        {!cam.ready && (
          <div className="absolute inset-0 flex items-center justify-center text-white/80">
            <Loader2 className="size-8 animate-spin" aria-label="Kamera açılıyor" />
          </div>
        )}

        {/* Frozen shot + scanning-laser overlay while the photo is being analyzed. */}
        {busy && cam.frozenFrame && (
          // eslint-disable-next-line @next/next/no-img-element -- a data URL, not a real <Image> source
          <img src={cam.frozenFrame} alt="" aria-hidden className="absolute inset-0 size-full object-contain" />
        )}
        {busy && (
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute inset-x-0 h-1 bg-cta shadow-[0_0_16px_4px_#a8e40fcc] [animation:scan-line_1.8s_ease-in-out_infinite]" />
            <div className="absolute inset-0 bg-black/25" />
          </div>
        )}
        {busy && (
          <div role="status" className="pointer-events-none absolute inset-x-0 bottom-3 flex items-center justify-center gap-2 text-sm font-medium text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.8)]">
            <ScanLine className="size-4 animate-pulse" aria-hidden />
            Tabağındaki bileşenler ayrıştırılıyor…
          </div>
        )}

        {/* Viewfinder reticle */}
        {!busy && (
          <div aria-hidden className="pointer-events-none absolute inset-[12%]">
            <span className="absolute top-0 left-0 size-8 rounded-tl-xl border-t-4 border-l-4 border-white/90" />
            <span className="absolute top-0 right-0 size-8 rounded-tr-xl border-t-4 border-r-4 border-white/90" />
            <span className="absolute bottom-0 left-0 size-8 rounded-bl-xl border-b-4 border-l-4 border-white/90" />
            <span className="absolute right-0 bottom-0 size-8 rounded-br-xl border-r-4 border-b-4 border-white/90" />
          </div>
        )}
        {!busy && cam.countdown === null && (
          <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-xs font-medium text-white/90 [text-shadow:0_1px_3px_rgb(0_0_0/0.8)]">
            Öğününü çerçevenin ortasına al
          </p>
        )}

        {cam.countdown !== null && (
          <div aria-live="assertive" className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span
              key={cam.countdown}
              className="flex size-20 items-center justify-center rounded-full bg-black/50 text-4xl font-bold text-white [animation:count-pop_0.5s_ease-out]"
            >
              {cam.countdown}
            </span>
          </div>
        )}
      </div>

      {cam.captureError && (
        <p role="alert" className="text-center text-[13px] text-danger-text">
          Fotoğraf çekilemedi, lütfen tekrar dene.
        </p>
      )}

      <button type="button" disabled={!cam.ready || cam.countdown !== null || busy} onClick={cam.startCountdown} className="btn btn-primary btn-lg w-full">
        {busy ? <Loader2 aria-hidden className="size-[18px] animate-spin" /> : <Aperture aria-hidden className="size-[18px]" />}
        {busy ? "Analiz ediliyor…" : cam.countdown !== null ? `Sabit tut… ${cam.countdown}` : "Çek ve analiz et"}
      </button>
    </div>
  );
}
