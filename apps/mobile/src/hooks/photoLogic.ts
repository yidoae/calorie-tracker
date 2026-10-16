/*
 * The photo as it leaves the phone (003 FR-002): the long edge at most 1024 px, re-encoded as JPEG
 * (which drops EXIF and location). The function refuses anything over 1600 px. No React Native
 * imports, so tests/photoLogic.test.ts runs this under node.
 */

export const PHOTO_MAX_SIDE = 1024;
/** JPEG quality: plates stay recognisable at about 150–300 KB (research.md §3). */
export const PHOTO_QUALITY = 0.7;

/** The resize for expo-image-manipulator, or null when the photo is small enough already. */
export function resizeTarget(width: number, height: number): { width: number } | { height: number } | null {
  if (Math.max(width, height) <= PHOTO_MAX_SIDE) return null;
  return width >= height ? { width: PHOTO_MAX_SIDE } : { height: PHOTO_MAX_SIDE };
}
