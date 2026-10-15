// egg: raw and plain foods with USDA FoodData Central ids (values come from sources/usda/extract.json).
export default [
  { id: "egg", name: "Yumurta", category: "egg", fdcId: 171287, aliases: ["egg","yumurta"], typicalPortionG: 100, portions: [{ unit: "adet", grams: 50 }] },
  { id: "egg_boiled", name: "Haşlanmış yumurta", category: "egg", fdcId: 173424, aliases: ["haşlama yumurta","haşlanmış yumurta","katı yumurta","rafadan"], typicalPortionG: 100, portions: [{ unit: "adet", grams: 50 }] },
  { id: "egg_fried", name: "Omlet / sahanda yumurta", category: "egg", fdcId: 173423, aliases: ["omlet","sahanda yumurta","yağda yumurta"], typicalPortionG: 120, portions: [{ unit: "adet", grams: 60 }] },
  { id: "egg_white", name: "Yumurta beyazı", category: "egg", fdcId: 172183, aliases: ["yumurta beyazı","yumurta akı"], typicalPortionG: 33, portions: [{ unit: "adet", grams: 33 }] },
  { id: "egg_yolk", name: "Yumurta sarısı", category: "egg", fdcId: 172184, aliases: ["yumurta sarısı"], typicalPortionG: 17, portions: [{ unit: "adet", grams: 17 }] },
  { id: "egg_quail", name: "Bıldırcın yumurtası", category: "egg", fdcId: 172191, aliases: ["bıldırcın yumurtası"], typicalPortionG: 45, portions: [{ unit: "adet", grams: 9 }] },
  { id: "egg_scrambled", name: "Çırpılmış yumurta (pişmiş)", category: "egg", fdcId: 172187, aliases: ["scrambled","çırpma yumurta","karıştırılmış yumurta"], typicalPortionG: 120 },
  { id: "egg_poached", name: "Poşe yumurta", category: "egg", fdcId: 172186, aliases: ["poşe yumurta","çılbır yumurtası"], typicalPortionG: 50, portions: [{ unit: "adet", grams: 50 }] },
];
