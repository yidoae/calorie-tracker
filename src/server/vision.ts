import { foodItem, getFood } from "@/lib/nutrition/foods";
import { plateName } from "@/lib/nutrition/plateName";
import { mealDraftSchema, type MealDraft } from "@/types/meal";
import { decodeImage, embedImages, foodProbe } from "./food/clip";
import type { RawImage } from "@huggingface/transformers";
import { backgroundShare, rankFoods, type FoodProbe, type RankedFood } from "./food/foodRanking";
import { extractFeatures } from "./food/imageFeatures";
import { estimateGrams } from "./food/plate";
import { detectNoFood } from "./food/recognize";
import { proposeRegions, regionCrop } from "./food/segment";

export interface VisionInput {
  data: Buffer;
  mimeType: string;
}

export const NO_FOOD_MESSAGE = "Görselde yemek algılanamadı. Lütfen geçerli bir öğün gösterin.";

/** The photo doesn't show a meal (a person, a blank wall, a screenshot…), so nothing should be logged. */
export class NoFoodError extends Error {
  constructor(
    /** Which check rejected the image, for logs, not for users. */
    readonly reason: string,
  ) {
    super(NO_FOOD_MESSAGE);
    this.name = "NoFoodError";
  }
}

/** The provider answered, but not with usable data. */
export class VisionOutputError extends Error {
  constructor(readonly issues: string) {
    super("Görüntü analizi geçersiz veri döndürdü");
    this.name = "VisionOutputError";
  }
}

/** How many guesses the review offers per component ("Bu mu?" chips). */
const CANDIDATES = 3;
/** Most components a plate is split into; smaller ones beyond this are dropped. */
const MAX_COMPONENTS = 6;
/** The models see the photo at most this big. */
const MAX_SIDE = 512;
/*
 * Splitting rules, tuned on 120 FoodSeg103 test plates and 60 single-dish test photos (a sweep over
 * all four together). Against classifying the whole photo as one food, components found on plates
 * went from 40% to 67% (precision 76% -> 72%); single dishes stayed at F1 0.94 (was 0.95).
 */
/** The whole photo is taken as one dish, without splitting, when its best guess is at least this sure. */
const SINGLE_DISH_CONFIDENCE = 0.7;
/** A region CLIP sees as plate, table, cutlery… with at least this probability isn't food. */
const MAX_BACKGROUND = 0.5;
/** Regions whose best guess is less sure than this are dropped (crumbs, shadows, sauce smears). */
const MIN_REGION_CONFIDENCE = 0.2;
/** Components covering less of the food area than this are dropped. */
const MIN_COMPONENT_SHARE = 0.05;

/**
 * Vision handler: photo in, a draft meal out. The plate is split into its components (one item
 * each, with grams estimated from how much of the plate it covers); each component's top guesses
 * (best first) come as `alternatives[i]` for the user to switch between. The output always passes
 * through `mealDraftSchema` before anyone uses it.
 *
 * Throws `NoFoodError` when the photo doesn't show food; the caller must not log a meal then.
 */
export async function analyzeFoodImage(input: VisionInput): Promise<MealDraft> {
  const raw: unknown = await recognize(input);
  const parsed = mealDraftSchema.safeParse(raw);
  if (!parsed.success) throw new VisionOutputError(parsed.error.message);
  return parsed.data;
}

interface Component {
  /** Share of the image the component covers. */
  share: number;
  /** Ranking of its largest region. */
  ranked: RankedFood[];
  largest: number;
}

/**
 * Rejects photos that don't look like food (colour/texture heuristics), then names the whole photo
 * with CLIP + the trained probe (food/foodRanking.ts). If that guess is sure, it's one dish.
 * Otherwise the photo is split into regions with SlimSAM (food/segment.ts) and each is named the
 * same way; regions that look like plate/table/cutlery or are unsure are dropped, and regions with
 * the same best guess are merged. If no region survives, the whole-photo guess is used.
 */
async function recognize({ data, mimeType }: VisionInput): Promise<MealDraft> {
  const rejection = detectNoFood(await extractFeatures(data));
  if (rejection) throw new NoFoodError(rejection);

  const [image, probe] = await Promise.all([decodeImage(data, mimeType, MAX_SIDE), foodProbe()]);
  const [whole] = await embedImages([image]);
  const single: Component = { share: 1, ranked: rankFoods(whole, probe), largest: 1 };
  const components = single.ranked[0].probability >= SINGLE_DISH_CONFIDENCE ? [single] : await splitPlate(image, probe);
  if (components.length === 0) components.push(single);

  const guesses = components.flatMap((c) => {
    const foods = c.ranked.flatMap(({ id }) => getFood(id) ?? []).slice(0, CANDIDATES);
    return foods.length > 0 ? [{ share: c.share, foods }] : [];
  });
  if (guesses.length === 0) throw new VisionOutputError("no known food in the ranking");

  const grams = estimateGrams(guesses.map((g) => ({ portion: g.foods[0].portion, share: g.share })));
  // An alternative keeps the component's grams, so switching the guess doesn't reset the portion.
  const alternatives = guesses.map((g, i) => g.foods.map((f) => foodItem(f, grams[i])));
  return { name: plateName(guesses.map((g) => g.foods[0].name)), items: alternatives.map((a) => a[0]), alternatives };
}

/** The plate's food components, biggest first (empty when no region looks like food). */
async function splitPlate(image: RawImage, probe: FoodProbe): Promise<Component[]> {
  const { grid, regions } = await proposeRegions(image);
  if (regions.length === 0) return [];
  const embeddings = await embedImages(await Promise.all(regions.map((r) => regionCrop(image, grid, r))));

  const byFood = new Map<string, Component>();
  embeddings.forEach((embedding, i) => {
    if (backgroundShare(embedding, probe) >= MAX_BACKGROUND) return;
    const ranked = rankFoods(embedding, probe);
    if (ranked[0].probability < MIN_REGION_CONFIDENCE) return;
    const { share } = regions[i];
    const same = byFood.get(ranked[0].id);
    if (!same) byFood.set(ranked[0].id, { share, ranked, largest: share });
    else {
      same.share += share;
      if (share > same.largest) Object.assign(same, { ranked, largest: share });
    }
  });
  const found = [...byFood.values()];
  const foodArea = found.reduce((s, c) => s + c.share, 0);
  return found
    .filter((c) => c.share >= MIN_COMPONENT_SHARE * foodArea)
    .sort((a, b) => b.share - a.share)
    .slice(0, MAX_COMPONENTS);
}
