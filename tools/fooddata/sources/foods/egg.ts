// egg: raw and plain foods with USDA FoodData Central ids (values come from sources/usda/extract.json).
export default [
  { id: "egg", name: "Yumurta", category: "egg", fdcId: 171287, aliases: ["egg","yumurta"], typicalPortionG: 100, portions: [{ unit: "adet", grams: 50 }] },
  { id: "egg_boiled", name: "Haşlanmış yumurta", category: "egg", fdcId: 173424, aliases: ["haşlama yumurta","haşlanmış yumurta","katı yumurta","rafadan"], typicalPortionG: 100, portions: [{ unit: "adet", grams: 50 }] },
  { id: "egg_fried", name: "Omlet / sahanda yumurta", category: "egg", fdcId: 173423, aliases: ["omlet","sahanda yumurta","yağda yumurta"], typicalPortionG: 120, portions: [{ unit: "adet", grams: 60 }] },
];
