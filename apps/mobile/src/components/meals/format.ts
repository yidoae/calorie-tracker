import { LOCALE } from "@calorie/core/dates";

/** Whole kilocalories in Turkish notation: 1.714. */
export const formatKcal = (kcal: number) => Math.round(kcal).toLocaleString(LOCALE);

/** Grams with at most one decimal and a decimal comma: 62,5. */
export const formatGrams = (grams: number) => grams.toLocaleString(LOCALE, { maximumFractionDigits: 1 });
