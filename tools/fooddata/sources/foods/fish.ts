// fish: raw and plain foods with USDA FoodData Central ids (values come from sources/usda/extract.json).
export default [
  { id: "salmon", name: "Somon (çiğ)", category: "fish", fdcId: 175167, aliases: ["salmon","somon","çiğ somon"], typicalPortionG: 150, portions: [{ unit: "fileto", grams: 198 }] }, // FDC 175167 SR "0.5 fillet" 198 g
  { id: "salmon_cooked", name: "Somon (pişmiş)", category: "fish", fdcId: 175168, aliases: ["fırın somon","pişmiş somon","ızgara somon"], typicalPortionG: 150, portions: [{ unit: "fileto", grams: 140 }] }, // FNDDS 26137120 "1 small/regular fillet" 140 g
  { id: "shrimp", name: "Karides (çiğ)", category: "fish", fdcId: 175179, aliases: ["karides","shrimp","çiğ karides"], typicalPortionG: 120, portions: [{ unit: "porsiyon", grams: 85 }] }, // FDC 175179 SR "3 oz" 85 g
  { id: "shrimp_cooked", name: "Karides (pişmiş)", category: "fish", fdcId: 175180, aliases: ["karides güveç","pişmiş karides","tereyağlı karides"], typicalPortionG: 120, portions: [{ unit: "adet", grams: 10 }, { unit: "porsiyon", grams: 85 }] }, // FNDDS 26319130 "1 small/medium shrimp" 10 g; FDC 175180 SR "3 oz" 85 g
  { id: "tuna", name: "Ton balığı (suda)", category: "fish", fdcId: 171986, aliases: ["ton","ton balığı"], typicalPortionG: 100, portions: [{ unit: "kutu", grams: 120 }] },
  { id: "tuna_oil", name: "Ton balığı (yağlı)", category: "fish", fdcId: 173708, aliases: ["yağlı ton","yağlı ton balığı","zeytinyağlı ton balığı"], typicalPortionG: 100, portions: [{ unit: "kutu", grams: 120 }] },
  { id: "sea_bass_raw", name: "Levrek (çiğ)", category: "fish", fdcId: 175142, aliases: ["levrek"], typicalPortionG: 200, portions: [{ unit: "adet", grams: 350 }] },
  { id: "sea_bream_raw", name: "Çipura (çiğ)", category: "fish", fdcId: 173698, aliases: ["çipura","mercan","sinagrit"], typicalPortionG: 200, portions: [{ unit: "adet", grams: 350 }] },
  { id: "anchovy_raw", name: "Hamsi (çiğ)", category: "fish", fdcId: 174182, aliases: ["hamsi"], typicalPortionG: 150, portions: [{ unit: "porsiyon", grams: 85 }] }, // FDC 174182 SR "3 oz" 85 g
  { id: "mackerel_raw", name: "Uskumru (çiğ)", category: "fish", fdcId: 175119, aliases: ["uskumru","kolyoz"], typicalPortionG: 150, portions: [{ unit: "adet", grams: 250 }] },
  { id: "bluefish_raw", name: "Lüfer (çiğ)", category: "fish", fdcId: 171949, aliases: ["lüfer","çinekop"], typicalPortionG: 200, portions: [{ unit: "fileto", grams: 150 }] }, // FDC 171949 SR "1 fillet" 150 g
  { id: "trout_raw", name: "Alabalık (çiğ)", category: "fish", fdcId: 173717, aliases: ["alabalık"], typicalPortionG: 200, portions: [{ unit: "adet", grams: 300 }] },
  { id: "cod_raw", name: "Morina (çiğ)", category: "fish", fdcId: 171955, aliases: ["morina","mezgit","beyaz balık"], typicalPortionG: 150, portions: [{ unit: "fileto", grams: 231 }] }, // FDC 171955 SR "1 fillet" 231 g
  { id: "tilapia_raw", name: "Tilapya (çiğ)", category: "fish", fdcId: 175176, aliases: ["tilapya"], typicalPortionG: 150, portions: [{ unit: "fileto", grams: 116 }] }, // FDC 175176 SR "1 fillet" 116 g
  { id: "haddock_raw", name: "Berlam (çiğ)", category: "fish", fdcId: 333374, aliases: ["berlam","bakalyaro"], typicalPortionG: 150, portions: [{ unit: "fileto", grams: 176 }] }, // FDC 333374 Foundation "1 fillet" 176 g
  { id: "flounder_raw", name: "Dil balığı (çiğ)", category: "fish", fdcId: 174196, aliases: ["dil balığı","pisi balığı","kalkan"], typicalPortionG: 150, portions: [{ unit: "fileto", grams: 163 }] }, // FDC 174196 SR "1 fillet" 163 g
  { id: "sardine_canned", name: "Sardalya (konserve, yağlı)", category: "fish", fdcId: 175139, aliases: ["sardalya","sardalya konservesi"], typicalPortionG: 90, portions: [{ unit: "kutu", grams: 90 }] },
  { id: "tuna_fresh_raw", name: "Taze ton balığı (çiğ)", category: "fish", fdcId: 175159, aliases: ["taze ton","ton balığı fileto"], typicalPortionG: 150, portions: [{ unit: "porsiyon", grams: 85 }] }, // FDC 175159 SR "3 oz" 85 g
  { id: "smoked_salmon", name: "Füme somon", category: "fish", fdcId: 173687, aliases: ["füme somon","tütsülenmiş somon"], typicalPortionG: 50, portions: [{ unit: "porsiyon", grams: 85 }] }, // FDC 173687 SR "3 oz" 85 g
  { id: "squid_raw", name: "Kalamar (çiğ)", category: "fish", fdcId: 174223, aliases: ["kalamar"], typicalPortionG: 150, portions: [{ unit: "porsiyon", grams: 85 }] }, // FDC 174223 SR "3 oz" 85 g
  { id: "mussel_raw", name: "Midye (çiğ)", category: "fish", fdcId: 174216, aliases: ["midye"], typicalPortionG: 100, portions: [{ unit: "adet", grams: 10 }] },
  { id: "octopus_raw", name: "Ahtapot (çiğ)", category: "fish", fdcId: 174218, aliases: ["ahtapot"], typicalPortionG: 150, portions: [{ unit: "porsiyon", grams: 85 }] }, // FDC 174218 SR "3 oz" 85 g
  { id: "crab_raw", name: "Yengeç (çiğ)", category: "fish", fdcId: 174204, aliases: ["yengeç","yengeç eti"], typicalPortionG: 100, portions: [{ unit: "adet", grams: 21 }] }, // FDC 174204 SR "1 crab" 21 g
  { id: "sea_bass_cooked", name: "Levrek ızgara", category: "fish", fdcId: 173694, aliases: ["levrek ızgara","fırın levrek","ızgara balık"], typicalPortionG: 200, portions: [{ unit: "fileto", grams: 101 }] }, // FDC 173694 SR "1 fillet" 101 g
  { id: "mackerel_cooked", name: "Uskumru ızgara", category: "fish", fdcId: 175120, aliases: ["uskumru ızgara","balık ekmek balığı"], typicalPortionG: 150, portions: [{ unit: "fileto", grams: 88 }] }, // FDC 175120 SR "1 fillet" 88 g
  { id: "mussel_cooked", name: "Midye (pişmiş)", category: "fish", fdcId: 174217, aliases: ["pişmiş midye","midye buğulama"], typicalPortionG: 100, portions: [{ unit: "su bardağı", grams: 135 }] }, // FNDDS 26313110 "1 cup" 135 g
];
