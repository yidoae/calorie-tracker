/*
 * Browser-only photo helpers (they use canvas / createImageBitmap).
 */

const MAX_PHOTO_EDGE = 1600;
const PASSTHROUGH_BYTES = 3 * 1024 * 1024;
const SERVER_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * Phone camera photos are often 12+ MP (can exceed the server's 10 MB cap) or HEIC, which the
 * server rejects. Re-encode anything big or unsupported to a downscaled JPEG; small supported
 * files (and GIFs) are sent untouched. Falls back to the original if the browser can't decode it.
 */
export async function preparePhoto(file: File): Promise<Blob> {
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

/** The current frame of a playing <video> as a data URL (for freezing the preview) and a JPEG blob. */
export async function captureFrame(video: HTMLVideoElement): Promise<{ preview: string; blob: Blob } | null> {
  if (!video.videoWidth || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return null;
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d")?.drawImage(video, 0, 0);
  const preview = canvas.toDataURL("image/jpeg", 0.85);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  return blob ? { preview, blob } : null;
}
