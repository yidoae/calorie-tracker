// Kebaplar, ızgaralar ve fırın ekmek işleri. FNDDS shish kabob and meat dishes are built from cooked
// meat (moisture change −5 %), so these start from the USDA cooked cut; grilled fat that drips away is
// then already out of the meat. Breads and flatbreads use FNDDS home-baked white bread (−8 %).
export default [
  {
    id: "kofte", name: "Köfte (ızgara)", category: "dish", aliases: ["köfte","ızgara köfte","kasap köfte"], typicalPortionG: 150, portions: [{ unit: "adet", grams: 25 }],
    ingredients: [{ foodId: "beef_mince_cooked", grams: 900 }, { foodId: "onion", grams: 100 }, { foodId: "bread_crumbs", grams: 50 }, { foodId: "cumin", grams: 4 }, { foodId: "salt", grams: 10 }],
    yield: { kind: "fndds", foodCode: 27410250 },
  },
  {
    id: "adana_kebap", name: "Adana kebap", category: "dish", aliases: ["adana","adana kebap","acılı kebap"], typicalPortionG: 180, portions: [{ unit: "şiş", grams: 90 }],
    ingredients: [{ foodId: "lamb_mince_cooked", grams: 900 }, { foodId: "red_pepper", grams: 80 }, { foodId: "paprika", grams: 8 }, { foodId: "salt", grams: 10 }],
    yield: { kind: "fndds", foodCode: 27430610 },
  },
  {
    id: "urfa_kebap", name: "Urfa kebap", category: "dish", aliases: ["urfa","urfa kebap","acısız kebap"], typicalPortionG: 180, portions: [{ unit: "şiş", grams: 90 }],
    ingredients: [{ foodId: "lamb_mince_cooked", grams: 900 }, { foodId: "onion", grams: 80 }, { foodId: "salt", grams: 10 }],
    yield: { kind: "fndds", foodCode: 27430610 },
  },
  {
    id: "chicken_shish", name: "Tavuk şiş", category: "dish", aliases: ["tavuk şiş","tavuk şiş kebap","şiş tavuk","tavuk kebap"], typicalPortionG: 180, portions: [{ unit: "şiş", grams: 90 }],
    ingredients: [{ foodId: "chicken_breast_grilled", grams: 900 }, { foodId: "yogurt", grams: 60 }, { foodId: "oil", grams: 25 }, { foodId: "tomato_paste", grams: 15 }, { foodId: "salt", grams: 10 }],
    yield: { kind: "fndds", foodCode: 27341020 },
  },
  {
    id: "lamb_shish", name: "Kuzu şiş", category: "dish", aliases: ["şiş kebap","kuzu şiş","çöp şiş","et şiş"], typicalPortionG: 180, portions: [{ unit: "şiş", grams: 80 }],
    ingredients: [{ foodId: "lamb_leg_cooked", grams: 900 }, { foodId: "onion", grams: 80 }, { foodId: "oil", grams: 15 }, { foodId: "salt", grams: 10 }],
    yield: { kind: "fndds", foodCode: 27430610 },
  },
  {
    id: "doner", name: "Et döner", category: "dish", aliases: ["döner","et döner","yaprak döner"], typicalPortionG: 150,
    ingredients: [{ foodId: "beef_stew_cooked", grams: 600 }, { foodId: "beef_mince_cooked", grams: 300 }, { foodId: "butter", grams: 60 }, { foodId: "onion", grams: 60 }, { foodId: "salt", grams: 10 }],
    yield: { kind: "fndds", foodCode: 27410250 },
  },
  {
    id: "chicken_doner", name: "Tavuk döner", category: "dish", aliases: ["tavuk döner"], typicalPortionG: 150,
    ingredients: [{ foodId: "chicken_thigh", grams: 900 }, { foodId: "yogurt", grams: 60 }, { foodId: "oil", grams: 40 }, { foodId: "tomato_paste", grams: 15 }, { foodId: "salt", grams: 10 }],
    yield: { kind: "fndds", foodCode: 27341020 },
  },
  {
    id: "iskender", name: "İskender", category: "dish", aliases: ["iskender","iskender kebap"], typicalPortionG: 350,
    ingredients: [{ foodId: "beef_stew_cooked", grams: 150 }, { foodId: "pita", grams: 100 }, { foodId: "yogurt", grams: 100 }, { foodId: "butter", grams: 25 }, { foodId: "tomato_paste", grams: 15 }, { foodId: "tomato", grams: 40 }],
    yield: { kind: "fndds", foodCode: 27516010 },
  },
  {
    id: "doner_wrap", name: "Dürüm döner", category: "dish", aliases: ["dürüm","dürüm döner","tavuk dürüm"], typicalPortionG: 250, portions: [{ unit: "adet", grams: 250 }],
    ingredients: [{ foodId: "chicken_thigh", grams: 120 }, { foodId: "lavash", grams: 70 }, { foodId: "tomato", grams: 30 }, { foodId: "lettuce_romaine", grams: 15 }, { foodId: "onion", grams: 15 }, { foodId: "mayonnaise", grams: 10 }],
    yield: { kind: "fndds", foodCode: 27516010 },
  },
  {
    id: "tantuni", name: "Tantuni", category: "dish", aliases: ["tantuni"], typicalPortionG: 200, portions: [{ unit: "adet", grams: 200 }],
    ingredients: [{ foodId: "beef_stew_cooked", grams: 100 }, { foodId: "lavash", grams: 70 }, { foodId: "oil", grams: 10 }, { foodId: "tomato", grams: 30 }, { foodId: "onion", grams: 20 }, { foodId: "parsley", grams: 5 }],
    yield: { kind: "fndds", foodCode: 27516010 },
  },
  {
    id: "lahmacun", name: "Lahmacun", category: "dish", aliases: ["lahmacun"], typicalPortionG: 140, portions: [{ unit: "adet", grams: 140 }],
    ingredients: [{ foodId: "flour", grams: 500 }, { foodId: "yeast", grams: 10 }, { foodId: "beef_mince_raw", grams: 300 }, { foodId: "onion", grams: 150 }, { foodId: "tomato", grams: 200 }, { foodId: "green_pepper", grams: 100 }, { foodId: "parsley", grams: 30 }, { foodId: "tomato_paste", grams: 30 }, { foodId: "paprika", grams: 5 }, { foodId: "oil", grams: 20 }, { foodId: "salt", grams: 12 }],
    waterG: 300, yield: { kind: "fndds", foodCode: 51101050 },
  },
  {
    id: "pide", name: "Kıymalı pide", category: "dish", aliases: ["kıymalı pide","pide"], typicalPortionG: 250, portions: [{ unit: "dilim", grams: 60 }, { unit: "adet", grams: 250 }],
    ingredients: [{ foodId: "flour", grams: 500 }, { foodId: "yeast", grams: 10 }, { foodId: "oil", grams: 30 }, { foodId: "beef_mince_raw", grams: 300 }, { foodId: "onion", grams: 150 }, { foodId: "tomato", grams: 150 }, { foodId: "green_pepper", grams: 80 }, { foodId: "butter", grams: 30 }, { foodId: "salt", grams: 12 }],
    waterG: 300, yield: { kind: "fndds", foodCode: 51101050 },
  },
  {
    id: "cheese_pide", name: "Kaşarlı pide", category: "dish", aliases: ["kaşarlı pide","peynirli pide"], typicalPortionG: 250, portions: [{ unit: "dilim", grams: 60 }, { unit: "adet", grams: 250 }],
    ingredients: [{ foodId: "flour", grams: 500 }, { foodId: "yeast", grams: 10 }, { foodId: "oil", grams: 30 }, { foodId: "kasar_cheese", grams: 300 }, { foodId: "egg", grams: 50 }, { foodId: "butter", grams: 30 }, { foodId: "salt", grams: 10 }],
    waterG: 300, yield: { kind: "fndds", foodCode: 51101050 },
  },
  {
    id: "hamburger", name: "Hamburger", category: "dish", aliases: ["hamburger","burger","cheeseburger"], typicalPortionG: 220, portions: [{ unit: "adet", grams: 220 }],
    ingredients: [{ foodId: "bun", grams: 90 }, { foodId: "beef_patty", grams: 100 }, { foodId: "tomato", grams: 20 }, { foodId: "lettuce_romaine", grams: 10 }, { foodId: "pickles", grams: 10 }, { foodId: "ketchup", grams: 10 }, { foodId: "mayonnaise", grams: 8 }],
    yield: { kind: "fndds", foodCode: 27510521 },
  },
];
