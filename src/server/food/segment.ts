import path from "node:path";
import { AutoProcessor, RawImage, SamModel, env, type PreTrainedModel, type Processor, type Tensor } from "@huggingface/transformers";
import { ownRegions, type Candidate, type MaskGrid, type Region } from "./plate";

/*
 * Class-agnostic segmentation with SlimSAM (a distilled Segment Anything), run in-process with ONNX
 * Runtime: the image is encoded once, then a grid of point prompts asks "which object is here?" at
 * each point. Weights (~40 MB) are downloaded on first use into .cache/.
 */

const SAM_MODEL = "Xenova/slimsam-77-uniform";
/** Point prompts per side; 8x8 takes ~3 s on a laptop CPU, about as long as encoding. */
const POINTS_PER_SIDE = 8;
/** Masks are compared on a grid of this many pixels per cell (enough for areas and crops). */
const CELL_PX = 4;
env.cacheDir = path.join(process.cwd(), ".cache", "transformers");

interface SamImageProcessor {
  reshape_input_points(points: unknown, originalSizes: unknown, reshapedSizes: unknown): Tensor;
  add_input_labels(labels: unknown, points: Tensor): Tensor;
  /** The square the resized image is padded to (1024 for SAM). */
  pad_size?: { width: number; height: number };
}

interface Segmenter {
  processor: Processor;
  model: SamModel;
}

let segmenterPromise: Promise<Segmenter> | null = null;

function segmenter(): Promise<Segmenter> {
  segmenterPromise ??= Promise.all([
    AutoProcessor.from_pretrained(SAM_MODEL),
    SamModel.from_pretrained(SAM_MODEL, { dtype: "fp32" }) as Promise<PreTrainedModel>,
  ])
    .then(([processor, model]) => ({ processor, model: model as SamModel }))
    .catch((err: unknown) => {
      segmenterPromise = null;
      throw err;
    });
  return segmenterPromise;
}

/** Regions of the photo (foods, but also the plate rim, cutlery, table…), on a coarse grid. */
export async function proposeRegions(image: RawImage): Promise<{ grid: MaskGrid; regions: Region[] }> {
  const { processor, model } = await segmenter();
  const inputs = await processor(image);
  const embeddings = await model.get_image_embeddings(inputs);

  const points: number[][][] = [];
  for (let row = 0; row < POINTS_PER_SIDE; row++) {
    for (let col = 0; col < POINTS_PER_SIDE; col++) {
      points.push([[((col + 0.5) / POINTS_PER_SIDE) * image.width, ((row + 0.5) / POINTS_PER_SIDE) * image.height]]);
    }
  }
  const imageProcessor = (processor as unknown as { image_processor: SamImageProcessor }).image_processor;
  const input_points = imageProcessor.reshape_input_points([points], inputs.original_sizes, inputs.reshaped_input_sizes);
  // Label 1 = "the object at this point".
  const input_labels = imageProcessor.add_input_labels([points.map(() => [1])], input_points);
  const { pred_masks, iou_scores } = (await model({ ...embeddings, input_points, input_labels })) as { pred_masks: Tensor; iou_scores: Tensor };

  const grid = { width: Math.max(1, Math.round(image.width / CELL_PX)), height: Math.max(1, Math.round(image.height / CELL_PX)) };
  const cells = grid.width * grid.height;
  const logits = pred_masks.data as Float32Array;
  const scores = iou_scores.data as Float32Array;

  // The low-res masks (logits) cover the resized image padded to a square; sample them at each
  // grid cell's centre instead of upscaling 192 masks to full size.
  const [lowH, lowW] = pred_masks.dims.slice(-2);
  const pad = imageProcessor.pad_size ?? { width: 1024, height: 1024 };
  const [resizedH, resizedW] = (inputs.reshaped_input_sizes as [number, number][])[0];
  const cellIndex = new Int32Array(cells);
  for (let gy = 0; gy < grid.height; gy++) {
    const ly = Math.min(lowH - 1, Math.floor((((gy + 0.5) / grid.height) * resizedH * lowH) / pad.height));
    for (let gx = 0; gx < grid.width; gx++) {
      const lx = Math.min(lowW - 1, Math.floor((((gx + 0.5) / grid.width) * resizedW * lowW) / pad.width));
      cellIndex[gy * grid.width + gx] = ly * lowW + lx;
    }
  }

  // SAM gives three nested guesses per point (part, object, group); keep each point's best.
  const candidates: Candidate[] = [];
  for (let p = 0; p < points.length; p++) {
    let best = 0;
    for (let m = 1; m < 3; m++) if (scores[p * 3 + m] > scores[p * 3 + best]) best = m;
    const offset = (p * 3 + best) * lowH * lowW;
    candidates.push({ mask: Uint8Array.from(cellIndex, (i) => (logits[offset + i] > 0 ? 1 : 0)), score: scores[p * 3 + best] });
  }
  return { grid, regions: ownRegions(grid, candidates) };
}

/**
 * The region cut out of the image for classification: the bounding box of the cells it owns plus a
 * margin, unmasked (the probe was trained on plain box crops; masked-out pixels confuse CLIP).
 */
export function regionCrop(image: RawImage, grid: MaskGrid, region: Region): Promise<RawImage> {
  const sx = image.width / grid.width;
  const sy = image.height / grid.height;
  const padX = (region.box.x1 - region.box.x0) * sx * 0.1;
  const padY = (region.box.y1 - region.box.y0) * sy * 0.1;
  const x0 = Math.max(0, Math.floor(region.box.x0 * sx - padX));
  const y0 = Math.max(0, Math.floor(region.box.y0 * sy - padY));
  const x1 = Math.min(image.width, Math.ceil(region.box.x1 * sx + padX));
  const y1 = Math.min(image.height, Math.ceil(region.box.y1 * sy + padY));
  return image.crop([x0, y0, x1 - 1, y1 - 1]);
}
