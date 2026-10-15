// nut_seed: raw and plain foods with USDA FoodData Central ids (values come from sources/usda/extract.json).
export default [
  { id: "almonds", name: "Badem", category: "nut_seed", fdcId: 170567, aliases: ["almond","badem"], typicalPortionG: 30, portions: [{ unit: "adet", grams: 1.2 }, { unit: "avuç", grams: 30 }] },
  { id: "sesame", name: "Susam", category: "nut_seed", fdcId: 170150, aliases: ["susam"], typicalPortionG: 10, portions: [{ unit: "yemek kaşığı", grams: 9 }] },
  { id: "walnuts", name: "Ceviz", category: "nut_seed", fdcId: 170187, aliases: ["ceviz","walnut"], typicalPortionG: 30, portions: [{ unit: "adet", grams: 5 }, { unit: "avuç", grams: 30 }] },
];
