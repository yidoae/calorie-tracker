import type { ResolvedFood } from "../rules.ts";

/**
 * out/foods.json: the list as tools/aieval reads it (003: the text preview and the model are
 * scored on it without a database). One food per line, so a diff shows what changed.
 */
export function foodsJson(foods: ResolvedFood[]): string {
  const rows = [...foods]
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map((f) => JSON.stringify({ id: f.id, name: f.name, typicalPortionG: f.typicalPortionG, per100: f.per100, portions: f.portions, aliases: f.aliases }));
  return `[\n${rows.join(",\n")}\n]\n`;
}
