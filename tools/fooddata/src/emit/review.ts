/*
 * tools/fooddata/dist/review.html (research §6, FR-013): one self-contained page for the owner's
 * sign-off: a table of every food with search, category and source filters; recipe rows open to their
 * ingredients and cooked weight; foods whose summary block differs from the committed out/foods.txt
 * are marked "değişti".
 */
import type { ResolvedFood } from "../rules.ts";
import { summaryText } from "./summary.ts";

const esc = (s: string) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const n = (x: number, d: number) => x.toFixed(d);

/** id → its block (main line plus indented lines) in a summary text. */
function blocks(summary: string): Map<string, string> {
  const out = new Map<string, string>();
  let id = "";
  for (const line of summary.split("\n")) {
    if (line.startsWith("    ")) out.set(id, `${out.get(id)}\n${line}`);
    else if (line) {
      id = line.slice(0, line.indexOf(" |"));
      out.set(id, line);
    }
  }
  return out;
}

export function reviewHtml(foods: ResolvedFood[], committedSummary: string): string {
  const sorted = [...foods].sort((a, b) => a.name.localeCompare(b.name, "tr"));
  const before = blocks(committedSummary);
  const now = blocks(summaryText(foods));
  const categories = [...new Set(sorted.map((f) => f.category))].sort();
  const changedCount = sorted.filter((f) => before.get(f.id) !== now.get(f.id)).length;

  const rows = sorted.map((f) => {
    const v = f.per100;
    const changed = before.get(f.id) !== now.get(f.id);
    const search = esc([f.name, f.id, ...f.aliases].join(" ").toLocaleLowerCase("tr-TR"));
    const portions = f.portions.map((p) => `${esc(p.unit)} ${n(p.grams, 0)} g`).join(", ");
    const details = f.recipe
      ? `<details><summary>tarif</summary><ul>${f.recipe.ingredients.map((i) => `<li>${esc(i.foodId)} ${n(i.grams, 1)} g</li>`).join("")}</ul><p>su ${n(f.recipe.waterG, 1)} g → pişmiş ${n(f.recipe.cookedG, 1)} g<br>${esc(f.recipe.yieldNote)}</p></details>`
      : "";
    const note = f.energyException ? `<div class="note">enerji istisnası: ${esc(f.energyException)}</div>` : "";
    return `<tr data-id="${esc(f.id)}" data-cat="${f.category}" data-src="${f.sourceKind}" data-q="${search}" data-changed="${changed ? 1 : 0}">
<td><b>${esc(f.name)}</b>${changed ? ' <span class="tag">değişti</span>' : ""}<div class="sub">${esc(f.aliases.join(", "))}</div>${note}</td>
<td>${f.category}</td><td>${f.sourceKind}<div class="sub">${esc(f.sourceRef)}</div>${details}</td>
<td class="num">${n(v.kcal, 0)}</td><td class="num">${n(v.protein, 1)}</td><td class="num">${n(v.carbs, 1)}</td><td class="num">${n(v.fat, 1)}</td><td class="num">${n(v.alcohol, 1)}</td>
<td>${n(f.typicalPortionG, 0)} g<div class="sub">${portions}</div></td></tr>`;
  });

  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Yiyecek listesi incelemesi</title>
<style>
:root{--bg:#fff;--fg:#14171a;--muted:#5b6470;--line:#d9dde3;--tag:#b42318;--tagbg:#fde8e7;--head:#f4f6f8}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#121417;--fg:#e8eaed;--muted:#9aa3ad;--line:#2c3138;--tag:#ffb4ab;--tagbg:#3b1d1b;--head:#1b1f24}}
:root[data-theme="dark"]{--bg:#121417;--fg:#e8eaed;--muted:#9aa3ad;--line:#2c3138;--tag:#ffb4ab;--tagbg:#3b1d1b;--head:#1b1f24}
body{margin:0;padding:16px;background:var(--bg);color:var(--fg);font:14px/1.4 system-ui,sans-serif}
h1{font-size:20px;margin:0 0 4px}.lead{color:var(--muted);margin:0 0 12px}
.bar{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}
input,select{font:inherit;padding:6px 8px;border:1px solid var(--line);border-radius:6px;background:var(--bg);color:var(--fg)}
input{flex:1 1 200px}.wrap{overflow-x:auto}
table{border-collapse:collapse;width:100%;min-width:760px}th,td{border-bottom:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top}
th{position:sticky;top:0;background:var(--head)}.num{text-align:right;font-variant-numeric:tabular-nums}
.sub{color:var(--muted);font-size:12px}.note{color:var(--tag);font-size:12px}
.tag{color:var(--tag);background:var(--tagbg);border-radius:4px;padding:0 4px;font-size:11px}
details summary{cursor:pointer;color:var(--muted);font-size:12px}details ul{margin:4px 0;padding-left:16px}
</style></head><body>
<h1>Yiyecek listesi incelemesi</h1>
<p class="lead">${sorted.length} yiyecek · ${sorted.filter((f) => f.category === "dish").length} yemek · ${changedCount} değişti. Değerler 100 g başına (kcal, protein, karbonhidrat, yağ, alkol).</p>
<div class="bar"><input id="q" type="search" placeholder="Ara: ad veya alias" aria-label="Ara">
<select id="category" aria-label="Kategori"><option value="">Tüm kategoriler</option>${categories.map((c) => `<option value="${c}">${c}</option>`).join("")}</select>
<select id="source" aria-label="Kaynak"><option value="">Tüm kaynaklar</option><option value="usda">usda</option><option value="recipe">recipe</option><option value="label">label</option></select>
<select id="changed" aria-label="Değişiklik"><option value="">Hepsi</option><option value="1">Sadece değişenler</option></select></div>
<p class="lead" id="count"></p>
<div class="wrap"><table><thead><tr><th>Yiyecek</th><th>Kategori</th><th>Kaynak</th><th class="num">kcal</th><th class="num">P</th><th class="num">K</th><th class="num">Y</th><th class="num">Alk</th><th>Porsiyon</th></tr></thead>
<tbody>
${rows.join("\n")}
</tbody></table></div>
<script>
const q=document.getElementById("q"),cat=document.getElementById("category"),src=document.getElementById("source"),chg=document.getElementById("changed"),count=document.getElementById("count");
const rows=[...document.querySelectorAll("tbody tr")];
function apply(){const t=q.value.toLocaleLowerCase("tr-TR").trim();let shown=0;
for(const r of rows){const ok=(!t||r.dataset.q.includes(t))&&(!cat.value||r.dataset.cat===cat.value)&&(!src.value||r.dataset.src===src.value)&&(!chg.value||r.dataset.changed===chg.value);r.hidden=!ok;if(ok)shown++;}
count.textContent=shown+" yiyecek gösteriliyor";}
for(const el of [q,cat,src,chg])el.addEventListener("input",apply);apply();
</script>
</body></html>
`;
}
