import { CATEGORY_LABELS } from "@/lib/labels";
import type { FoodCategory } from "@/types/nutrition";

const TONE: Record<FoodCategory, string> = {
  protein: "bg-warning-soft text-warning-text",
  carb: "bg-accent-soft text-accent-text",
  fat: "bg-success-soft text-success-text",
  vegetable: "bg-success-soft text-success-text",
  fruit: "bg-danger-soft text-danger-text",
  dairy: "bg-surface-3 text-fg",
};

/** Small pill naming what role a food plays on the plate (protein kaynağı, karbonhidrat, …). */
export default function CategoryChip({ category }: { category: FoodCategory }) {
  return <span className={`badge shrink-0 ${TONE[category]}`}>{CATEGORY_LABELS[category]}</span>;
}
