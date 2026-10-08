/*
 * Colour families the food/non-food guard measures in a photo (see imageFeatures.ts and
 * recognize.ts). Which food it is comes from the CLIP classifier (foodRanking.ts).
 */

/** Colour families a food can show up as in a photo. */
export const FOOD_COLORS = ["green", "red", "orange", "yellow", "tan", "brown", "white", "purple"] as const;
export type FoodColor = (typeof FOOD_COLORS)[number];
