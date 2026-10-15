// fish: raw and plain foods with USDA FoodData Central ids (values come from sources/usda/extract.json).
export default [
  { id: "salmon", name: "Somon (çiğ)", category: "fish", fdcId: 175167, aliases: ["salmon","somon","çiğ somon"], typicalPortionG: 150 },
  { id: "salmon_cooked", name: "Somon (pişmiş)", category: "fish", fdcId: 175168, aliases: ["fırın somon","pişmiş somon","ızgara somon"], typicalPortionG: 150 },
  { id: "shrimp", name: "Karides (çiğ)", category: "fish", fdcId: 175179, aliases: ["karides","shrimp","çiğ karides"], typicalPortionG: 120 },
  { id: "shrimp_cooked", name: "Karides (pişmiş)", category: "fish", fdcId: 175180, aliases: ["karides güveç","pişmiş karides","tereyağlı karides"], typicalPortionG: 120 },
  { id: "tuna", name: "Ton balığı (suda)", category: "fish", fdcId: 171986, aliases: ["ton","ton balığı"], typicalPortionG: 100, portions: [{ unit: "kutu", grams: 120 }] },
  { id: "tuna_oil", name: "Ton balığı (yağlı)", category: "fish", fdcId: 173708, aliases: ["yağlı ton","yağlı ton balığı","zeytinyağlı ton balığı"], typicalPortionG: 100, portions: [{ unit: "kutu", grams: 120 }] },
];
