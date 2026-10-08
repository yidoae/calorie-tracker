import { readFile } from "node:fs/promises";
import path from "node:path";
import { AutoProcessor, CLIPVisionModelWithProjection, RawImage, env, type Processor, type PreTrainedModel } from "@huggingface/transformers";
import type { FoodProbe } from "./foodRanking";

/*
 * The CLIP image encoder behind photo recognition, run in-process with ONNX Runtime. The weights
 * (~350 MB, fp32) are downloaded from Hugging Face on first use and kept in .cache/ (ignored by
 * git). fp32 on purpose: the 8-bit model's embeddings drift too far from the ones the probe was
 * trained on (cosine ~0.9 vs ~0.99).
 */

/** ONNX export of the model ml/train.py used (openai/clip-vit-base-patch16). */
const ONNX_MODEL = "Xenova/clip-vit-base-patch16";
const PROBE_PATH = path.join(process.cwd(), "ml", "models", "food-probe.json");
env.cacheDir = path.join(process.cwd(), ".cache", "transformers");

interface Encoder {
  processor: Processor;
  model: PreTrainedModel;
}

let encoderPromise: Promise<Encoder> | null = null;
let probePromise: Promise<FoodProbe> | null = null;

/** One encoder per server process; a failed load is retried on the next request. */
function encoder(): Promise<Encoder> {
  encoderPromise ??= Promise.all([
    AutoProcessor.from_pretrained(ONNX_MODEL),
    CLIPVisionModelWithProjection.from_pretrained(ONNX_MODEL, { dtype: "fp32" }),
  ])
    .then(([processor, model]) => ({ processor, model }))
    .catch((err: unknown) => {
      encoderPromise = null;
      throw err;
    });
  return encoderPromise;
}

export function foodProbe(): Promise<FoodProbe> {
  probePromise ??= readFile(PROBE_PATH, "utf8")
    .then((text) => JSON.parse(text) as FoodProbe)
    .catch((err: unknown) => {
      probePromise = null;
      throw err;
    });
  return probePromise;
}

/** The photo as RGB, shrunk so its longer side is at most `maxSide` (the models work smaller anyway). */
export async function decodeImage(data: Buffer, mimeType: string, maxSide: number): Promise<RawImage> {
  const image = (await RawImage.fromBlob(new Blob([new Uint8Array(data)], { type: mimeType }))).rgb();
  const scale = maxSide / Math.max(image.width, image.height);
  return scale < 1 ? image.resize(Math.round(image.width * scale), Math.round(image.height * scale)) : image;
}

/** L2-normalised CLIP embeddings, one per image, computed as one batch. */
export async function embedImages(images: RawImage[]): Promise<Float32Array[]> {
  const { processor, model } = await encoder();
  const { image_embeds } = await model(await processor(images));
  const [n, dim] = image_embeds.dims as [number, number];
  const data = image_embeds.data as Float32Array;
  return Array.from({ length: n }, (_, i) => {
    const v = data.slice(i * dim, (i + 1) * dim);
    const norm = Math.hypot(...v);
    return v.map((x) => x / norm);
  });
}
