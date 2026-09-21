import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

// Uploaded photos live outside `public/` so they are served by our own route
// (files added to `public/` after build aren't reliably served in production).
const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const MIME_BY_EXT: Record<string, string> = Object.fromEntries(
  Object.entries(EXT_BY_MIME).map(([mime, ext]) => [ext, mime]),
);

export const ALLOWED_MIME_TYPES = Object.keys(EXT_BY_MIME);

/** Only filenames we generate ourselves — also blocks path traversal. */
const FILENAME_RE = /^[0-9a-f-]{36}\.(jpg|png|webp|gif)$/;

export function isValidFilename(filename: string): boolean {
  return FILENAME_RE.test(filename);
}

/** Persist an image and return its public URL path. */
export async function saveImage(data: Buffer, mimeType: string): Promise<string> {
  const filename = `${randomUUID()}.${EXT_BY_MIME[mimeType]}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), data);
  return `/api/uploads/${filename}`;
}

export async function readImage(filename: string): Promise<Buffer | null> {
  if (!isValidFilename(filename)) return null;
  try {
    return await readFile(path.join(UPLOAD_DIR, filename));
  } catch {
    return null;
  }
}

/** Best-effort removal of a stored image given its URL path. */
export async function deleteImage(imageUrl: string | null): Promise<void> {
  const filename = imageUrl?.split("/").pop();
  if (!filename || !isValidFilename(filename)) return;
  try {
    await unlink(path.join(UPLOAD_DIR, filename));
  } catch {
    // already gone — nothing to do
  }
}
