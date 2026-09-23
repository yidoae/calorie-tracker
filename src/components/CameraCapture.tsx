"use client";

import { Aperture, Loader2, ScanLine } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Props {
  /** Receives the captured frame as a JPEG. */
  onCapture: (image: Blob) => void;
  /** True while the parent is sending the captured photo to the vision model. */
  analyzing: boolean;
}

type Status = { kind: "starting" } | { kind: "ready" } | { kind: "error"; message: string };

const COUNTDOWN_STEP_MS = 650;

function describeError(err: unknown): string {
  const name = err instanceof DOMException ? err.name : "";
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Camera access was blocked. Allow camera permission for this site, or use Upload instead.";
    case "NotFoundError":
    case "OverconstrainedError":
      return "No camera was found on this device. Use Upload instead.";
    case "NotReadableError":
      return "The camera is being used by another app. Close it and try again.";
    default:
      return "Couldn't start the camera. Use Upload instead.";
  }
}

/**
 * Live camera preview with a viewfinder, a shutter countdown, and a capture button.
 * Once captured the frame freezes with a scanning-laser overlay until `analyzing`
 * turns false. The stream starts on mount and is released on unmount, so render it
 * only while it should be on. Requires a secure context (https or localhost) and
 * `navigator.mediaDevices`.
 */
export default function CameraCapture({ onCapture, analyzing }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<Status>({ kind: "starting" });
  const [captureError, setCaptureError] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [frozenFrame, setFrozenFrame] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } }, audio: false })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch((err: unknown) => {
        if (!cancelled) setStatus({ kind: "error", message: describeError(err) });
      });

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0);
    setFrozenFrame(canvas.toDataURL("image/jpeg", 0.85));
    canvas.toBlob(
      (blob) => {
        if (blob) onCapture(blob);
        else setCaptureError(true);
      },
      "image/jpeg",
      0.9,
    );
  }

  /** 3…2…1 shutter countdown, then captures the frame. */
  function startCountdown() {
    if (countdown !== null) return;
    setCaptureError(false);
    let remaining = 3;
    setCountdown(remaining);
    const tick = () => {
      remaining -= 1;
      if (remaining > 0) {
        setCountdown(remaining);
        setTimeout(tick, COUNTDOWN_STEP_MS);
      } else {
        setCountdown(null);
        capture();
      }
    };
    setTimeout(tick, COUNTDOWN_STEP_MS);
  }

  if (status.kind === "error") {
    return (
      <p role="alert" className="rounded-xl bg-red-50 px-4 py-6 text-center text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
        {status.message}
      </p>
    );
  }

  const ready = status.kind === "ready";
  const busy = frozenFrame !== null && analyzing;

  return (
    <div className="space-y-4">
      <div className="relative min-h-64 overflow-hidden rounded-2xl bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onLoadedMetadata={() => setStatus({ kind: "ready" })}
          className={`block max-h-[60dvh] w-full object-contain ${busy ? "invisible" : ""}`}
        />

        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center text-white/80">
            <Loader2 className="size-8 animate-spin" aria-label="Starting camera" />
          </div>
        )}

        {/* Frozen shot + scanning-laser overlay while the photo is being analyzed. */}
        {busy && (
          // eslint-disable-next-line @next/next/no-img-element -- a data URL, not a real <Image> source
          <img
            src={frozenFrame}
            alt=""
            aria-hidden
            className="absolute inset-0 size-full object-contain"
          />
        )}
        {busy && (
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute inset-x-0 h-1 bg-emerald-400/90 shadow-[0_0_16px_4px_rgba(52,211,153,0.8)] [animation:scan-line_1.8s_ease-in-out_infinite]" />
            <div className="absolute inset-0 bg-black/25" />
          </div>
        )}
        {busy && (
          <div role="status" className="pointer-events-none absolute inset-x-0 bottom-3 flex items-center justify-center gap-2 text-sm font-medium text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.8)]">
            <ScanLine className="size-4 animate-pulse" aria-hidden />
            Analyzing your meal…
          </div>
        )}

        {/* Viewfinder reticle */}
        {!busy && (
          <div aria-hidden className="pointer-events-none absolute inset-[12%]">
            <span className="absolute left-0 top-0 size-8 rounded-tl-xl border-l-4 border-t-4 border-white/90" />
            <span className="absolute right-0 top-0 size-8 rounded-tr-xl border-r-4 border-t-4 border-white/90" />
            <span className="absolute bottom-0 left-0 size-8 rounded-bl-xl border-b-4 border-l-4 border-white/90" />
            <span className="absolute bottom-0 right-0 size-8 rounded-br-xl border-b-4 border-r-4 border-white/90" />
          </div>
        )}
        {!busy && countdown === null && (
          <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-xs font-medium text-white/90 [text-shadow:0_1px_3px_rgb(0_0_0/0.8)]">
            Center your meal in the frame
          </p>
        )}

        {/* Shutter countdown */}
        {countdown !== null && (
          <div aria-live="assertive" className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span
              key={countdown}
              className="flex size-20 items-center justify-center rounded-full bg-black/50 text-4xl font-bold text-white [animation:count-pop_0.5s_ease-out]"
            >
              {countdown}
            </span>
          </div>
        )}
      </div>

      {captureError && (
        <p role="alert" className="text-center text-sm text-red-600 dark:text-red-400">
          Couldn&apos;t capture the photo — please try again.
        </p>
      )}

      <button
        type="button"
        disabled={!ready || countdown !== null || busy}
        onClick={startCountdown}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
      >
        {busy ? <Loader2 className="size-5 animate-spin" /> : <Aperture className="size-5" />}
        {busy ? "Analyzing…" : countdown !== null ? `Hold still… ${countdown}` : "Capture & Analyze"}
      </button>
    </div>
  );
}
