// dairy: raw and plain foods with USDA FoodData Central ids (values come from sources/usda/extract.json).
export default [
  { id: "butter", name: "Tereyağı", category: "dairy", fdcId: 173430, aliases: ["butter","tereyağı"], typicalPortionG: 10, portions: [{ unit: "çay kaşığı", grams: 5 }, { unit: "yemek kaşığı", grams: 14.2 }] },
  { id: "milk", name: "Süt (tam yağlı)", category: "dairy", fdcId: 171265, aliases: ["milk","süt","tam yağlı süt"], typicalPortionG: 200, portions: [{ unit: "su bardağı", grams: 200 }] },
  { id: "white_cheese", name: "Beyaz peynir", category: "dairy", fdcId: 173420, aliases: ["beyaz peynir","feta","peynir"], typicalPortionG: 30, portions: [{ unit: "dilim", grams: 30 }] },
  { id: "yogurt", name: "Yoğurt (tam yağlı)", category: "dairy", fdcId: 171284, aliases: ["yoğurt"], typicalPortionG: 150, portions: [{ unit: "yemek kaşığı", grams: 20 }, { unit: "kase", grams: 200 }] },
  { id: "yogurt_greek", name: "Süzme yoğurt", category: "dairy", fdcId: 171304, aliases: ["greek yogurt","süzme yoğurt","yunan yoğurdu"], typicalPortionG: 150, portions: [{ unit: "yemek kaşığı", grams: 20 }, { unit: "kase", grams: 200 }] },
];
