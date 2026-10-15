/*
 * tools/fooddata/out/foods.txt (contracts/pipeline.md): one line per food, recipes with their
 * ingredients, water and cooked weight. Committed, so its git diff is the readable change log of the
 * list (FR-013, US3 scenario 3).
 */
import type { ResolvedFood } from "../rules.ts";

const n = (x: number, d: number) => x.toFixed(d);

export function summaryText(foods: ResolvedFood[]): string {
  const lines: string[] = [];
  for (const f of [...foods].sort((a, b) => a.id.localeCompare(b.id))) {
    const v = f.per100;
    const portions = f.portions.map((p) => `${p.unit} ${n(p.grams, 1)} g`).join("; ");
    lines.push(
      `${f.id} | ${f.name} | ${f.category} | ${f.sourceRef} | ${n(v.kcal, 2)} kcal P${n(v.protein, 2)} C${n(v.carbs, 2)} F${n(v.fat, 2)} A${n(v.alcohol, 2)} | typ ${n(f.typicalPortionG, 1)} g${portions ? ` | ${portions}` : ""}`,
    );
    if (f.energyException) lines.push(`    energy exception: ${f.energyException}`);
    if (f.recipe) {
      for (const i of f.recipe.ingredients) lines.push(`    ${i.foodId} ${n(i.grams, 1)} g`);
      lines.push(`    water ${n(f.recipe.waterG, 1)} g → cooked ${n(f.recipe.cookedG, 1)} g (${f.recipe.yieldNote})`);
    }
  }
  return `${lines.join("\n")}\n`;
}
