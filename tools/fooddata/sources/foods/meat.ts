// meat: raw and plain foods with USDA FoodData Central ids (values come from sources/usda/extract.json).
export default [
  { id: "beef_mince_lean_raw", name: "Yağsız kıyma (çiğ)", category: "meat", fdcId: 171790, aliases: ["az yağlı kıyma","yağsız kıyma"], typicalPortionG: 125 },
  { id: "beef_mince_raw", name: "Kıyma (çiğ, orta yağlı)", category: "meat", fdcId: 171796, aliases: ["dana kıyma","kıyma","orta yağlı kıyma","çiğ kıyma"], typicalPortionG: 125 },
  { id: "beef_patty", name: "Hamburger köftesi (pişmiş)", category: "meat", fdcId: 174032, aliases: ["burger köftesi","hamburger köftesi"], typicalPortionG: 110, portions: [{ unit: "adet", grams: 110 }] },
  { id: "beef_raw", name: "Dana eti (çiğ, yağsız)", category: "meat", fdcId: 171816, aliases: ["dana eti","dana kuşbaşı","et","kuşbaşı","kırmızı et","çiğ et"], typicalPortionG: 150 },
  { id: "beef_sirloin_raw", name: "Dana antrikot (çiğ, yağlı)", category: "meat", fdcId: 168726, aliases: ["antrikot","yağlı dana eti"], typicalPortionG: 150 },
  { id: "steak", name: "Biftek (pişmiş)", category: "meat", fdcId: 169457, aliases: ["biftek","bonfile","steak"], typicalPortionG: 150 },
];
