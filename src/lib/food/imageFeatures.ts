import sharp from "sharp";
import { FOOD_COLORS, type FoodColor } from "./catalog";

/** Longest side, in pixels, images are shrunk to before analysis. */
const ANALYSIS_SIZE = 96;
/** The plate is usually in the middle: colours are measured inside this ellipse (radius as a fraction of each side), not on the table around it. */
const CENTER_RADIUS = 0.36;
/** Outer strip of the frame, as a fraction of each side, used to tell a person from a surface. */
const BORDER = 0.12;
/** Luma gradient below which a pixel counts as "smooth". */
const SMOOTH_GRADIENT = 3;

/** Cheap colour/texture statistics of a photo — the mock's stand-in for what a vision model would see. */
export interface ImageFeatures {
  /** Mean brightness, 0–1. */
  brightness: number;
  /** Mean luma gradient (0–255 scale). Near 0 for flat images such as a blank wall. */
  texture: number;
  /** Share of pixels with a skin tone, 0–1. */
  skinShare: number;
  /** Share of skin-toned pixels that sit in smooth areas. Faces are smooth; cooked food has grain and edges. */
  skinSmoothShare: number;
  /** Share of the outer frame that is skin-toned. High means a surface (wood table, bread), not a person in front of a background. */
  skinBorderShare: number;
  /** Share of the middle of the frame that is blue/cyan/violet — sky, water, screens; rarely food. */
  coolShare: number;
  /** Share of the middle of the frame per food colour family. Grey, black and cool pixels count towards none. */
  colors: Record<FoodColor, number>;
  /** Sum of `colors`. */
  foodShare: number;
}

type Pixel = FoodColor | "cool" | "neutral";

/** Buckets a pixel (hue 0–360°, saturation and value 0–1) into a food colour family. */
function classify(h: number, s: number, v: number): Pixel {
  if (v < 0.18) return "neutral"; // shadow, black
  if (s < 0.14) return v > 0.72 ? "white" : "neutral"; // plate, rice, dairy vs grey table
  if (h >= 170 && h < 270) return "cool";
  if (h >= 270 && h < 340) return "purple";
  if (h >= 70 && h < 170) return "green";
  if (h >= 340 || h < 12) return s >= 0.45 ? "red" : "tan";
  if (h < 38) return v < 0.55 ? "brown" : s >= 0.6 ? "orange" : "tan";
  return s >= 0.45 && v >= 0.5 ? "yellow" : v >= 0.5 ? "tan" : "brown"; // hues 38–70
}

/** Classic YCbCr skin-tone range, restricted to warm hues. */
function isSkin(r: number, g: number, b: number, h: number, s: number, v: number): boolean {
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  return cb >= 77 && cb <= 127 && cr >= 133 && cr <= 173 && (h <= 40 || h >= 350) && s >= 0.12 && s <= 0.75 && v >= 0.3;
}

/** Decodes the image and measures it. Throws if the bytes aren't a decodable image. */
export async function extractFeatures(image: Buffer): Promise<ImageFeatures> {
  const { data: rgb, info } = await sharp(image, { failOn: "none" })
    .rotate() // honour EXIF orientation
    .resize(ANALYSIS_SIZE, ANALYSIS_SIZE, { fit: "inside" })
    .flatten({ background: "#ffffff" }) // transparent pixels become white
    .toColourspace("srgb")
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info; // 3 channels: r, g, b
  const pixels = width * height;

  const luma = new Float32Array(pixels);
  const skin = new Uint8Array(pixels);
  const counts = Object.fromEntries(FOOD_COLORS.map((c) => [c, 0])) as Record<FoodColor, number>;
  let centerPixels = 0;
  let cool = 0;
  let skinCount = 0;
  let borderPixels = 0;
  let borderSkin = 0;
  let valueSum = 0;

  for (let i = 0; i < pixels; i++) {
    const x = (i % width) / width;
    const y = Math.floor(i / width) / height;
    const inCenter = (x - 0.5) ** 2 + (y - 0.5) ** 2 <= CENTER_RADIUS ** 2;
    const inBorder = x < BORDER || x >= 1 - BORDER || y < BORDER || y >= 1 - BORDER;

    const r = rgb[i * 3];
    const g = rgb[i * 3 + 1];
    const b = rgb[i * 3 + 2];
    const max = Math.max(r, g, b);
    const delta = max - Math.min(r, g, b);

    const v = max / 255;
    const s = max === 0 ? 0 : delta / max;
    let h = 0;
    if (delta > 0) {
      if (max === r) h = ((g - b) / delta) % 6;
      else if (max === g) h = (b - r) / delta + 2;
      else h = (r - g) / delta + 4;
      h = (h * 60 + 360) % 360;
    }

    luma[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    valueSum += v;

    if (inCenter) {
      centerPixels++;
      const kind = classify(h, s, v);
      if (kind === "cool") cool++;
      else if (kind !== "neutral") counts[kind]++;
    }

    if (inBorder) borderPixels++;
    if (isSkin(r, g, b, h, s, v)) {
      skin[i] = 1;
      skinCount++;
      if (inBorder) borderSkin++;
    }
  }

  // Local contrast: average of the horizontal and vertical luma steps.
  let gradientSum = 0;
  let skinGradientCount = 0;
  let smoothSkin = 0;
  for (let y = 0; y < height - 1; y++) {
    for (let x = 0; x < width - 1; x++) {
      const i = y * width + x;
      const gradient = (Math.abs(luma[i + 1] - luma[i]) + Math.abs(luma[i + width] - luma[i])) / 2;
      gradientSum += gradient;
      if (skin[i]) {
        skinGradientCount++;
        if (gradient < SMOOTH_GRADIENT) smoothSkin++;
      }
    }
  }

  const colors = Object.fromEntries(FOOD_COLORS.map((c) => [c, counts[c] / centerPixels])) as Record<FoodColor, number>;
  return {
    brightness: valueSum / pixels,
    texture: gradientSum / ((width - 1) * (height - 1)),
    skinShare: skinCount / pixels,
    skinSmoothShare: skinGradientCount > 0 ? smoothSkin / skinGradientCount : 0,
    skinBorderShare: borderSkin / borderPixels,
    coolShare: cool / centerPixels,
    colors,
    foodShare: FOOD_COLORS.reduce((sum, c) => sum + colors[c], 0),
  };
}
