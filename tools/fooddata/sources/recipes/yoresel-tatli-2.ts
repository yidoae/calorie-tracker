// Yöresel ve ev yemekleri, ev tatlıları (admin batch 2). Each yield is the FNDDS moisture change of
// the closest dish; a stand-in ingredient is named in a comment where Turkish cooking uses one SR lacks.
export default [
  {
    id: "kuymak", name: "Kuymak (mıhlama)", category: "dish", aliases: ["kuymak","mıhlama","muhlama"], typicalPortionG: 200, portions: [{ unit: "porsiyon", grams: 200 }],
    ingredients: [{ foodId: "cornmeal", grams: 100 }, { foodId: "butter", grams: 80 }, { foodId: "kasar_cheese", grams: 250 }, { foodId: "salt", grams: 3 }],
    waterG: 400, yield: { kind: "fndds", foodCode: 56201517 },
  },
  {
    id: "cig_borek", name: "Çiğ börek", category: "dish", aliases: ["çiğ börek","çibörek"], typicalPortionG: 150, portions: [{ unit: "adet", grams: 120 }],
    ingredients: [{ foodId: "flour", grams: 500 }, { foodId: "beef_mince_raw", grams: 300 }, { foodId: "onion", grams: 150 }, { foodId: "sunflower_oil", grams: 150 }, { foodId: "salt", grams: 10 }],
    waterG: 250, yield: { kind: "fndds", foodCode: 58111110 },
  },
  {
    id: "kol_boregi", name: "Patatesli kol böreği", category: "dish", aliases: ["kol böreği","patatesli börek","patatesli kol böreği"], typicalPortionG: 150, portions: [{ unit: "dilim", grams: 100 }],
    ingredients: [{ foodId: "phyllo", grams: 500 }, { foodId: "potato", grams: 400 }, { foodId: "onion", grams: 100 }, { foodId: "milk", grams: 150 }, { foodId: "egg", grams: 50 }, { foodId: "oil", grams: 100 }, { foodId: "paprika", grams: 3 }, { foodId: "salt", grams: 8 }],
    yield: { kind: "fndds", foodCode: 58124250 },
  },
  {
    // Kaymak is replaced by heavy cream, the closest SR dairy fat.
    id: "katmer", name: "Katmer (fıstıklı)", category: "sweet", aliases: ["katmer","antep katmeri","fıstıklı katmer"], typicalPortionG: 150, portions: [{ unit: "adet", grams: 150 }],
    ingredients: [{ foodId: "phyllo", grams: 200 }, { foodId: "butter", grams: 80 }, { foodId: "pistachios", grams: 80 }, { foodId: "cream_heavy", grams: 100 }, { foodId: "sugar", grams: 60 }],
    yield: { kind: "fndds", foodCode: 53452400 },
  },
  {
    // Dövme buğday is replaced by pearled barley, as in aşure.
    id: "keskek", name: "Keşkek", category: "dish", aliases: ["keşkek","herise"], typicalPortionG: 250, portions: [{ unit: "kase", grams: 250 }],
    ingredients: [{ foodId: "barley", grams: 400 }, { foodId: "lamb_shoulder_raw", grams: 500 }, { foodId: "butter", grams: 50 }, { foodId: "paprika", grams: 3 }, { foodId: "salt", grams: 12 }],
    waterG: 1500, yield: { kind: "fndds", foodCode: 56207200 },
  },
  {
    id: "testi_kebabi", name: "Testi kebabı", category: "dish", aliases: ["testi kebabı"], typicalPortionG: 300, portions: [{ unit: "porsiyon", grams: 300 }],
    ingredients: [{ foodId: "beef_stew_raw", grams: 600 }, { foodId: "tomato", grams: 300 }, { foodId: "green_pepper", grams: 150 }, { foodId: "onion", grams: 150 }, { foodId: "garlic", grams: 15 }, { foodId: "butter", grams: 40 }, { foodId: "salt", grams: 10 }],
    yield: { kind: "fndds", foodCode: 27411100 },
  },
  {
    id: "kusbasili_pide", name: "Kuşbaşılı pide", category: "dish", aliases: ["kuşbaşılı pide","kuşbaşı pide"], typicalPortionG: 250, portions: [{ unit: "dilim", grams: 60 }, { unit: "adet", grams: 300 }],
    ingredients: [{ foodId: "flour", grams: 500 }, { foodId: "yeast", grams: 10 }, { foodId: "beef_stew_raw", grams: 400 }, { foodId: "tomato", grams: 150 }, { foodId: "green_pepper", grams: 100 }, { foodId: "butter", grams: 30 }, { foodId: "salt", grams: 12 }],
    waterG: 280, yield: { kind: "fndds", foodCode: 51101050 },
  },
  {
    id: "kapuska", name: "Kapuska", category: "dish", aliases: ["kapuska","lahana yemeği","kıymalı lahana"], typicalPortionG: 250, portions: [{ unit: "porsiyon", grams: 250 }],
    ingredients: [{ foodId: "cabbage", grams: 1000 }, { foodId: "beef_mince_raw", grams: 200 }, { foodId: "onion", grams: 100 }, { foodId: "rice_raw", grams: 50 }, { foodId: "tomato_paste", grams: 30 }, { foodId: "oil", grams: 30 }, { foodId: "paprika", grams: 3 }, { foodId: "salt", grams: 10 }],
    waterG: 300, yield: { kind: "fndds", foodCode: 75211031 },
  },
  {
    id: "potato_stew", name: "Patates yemeği", category: "dish", aliases: ["patates yemeği","sulu patates"], typicalPortionG: 250, portions: [{ unit: "porsiyon", grams: 250 }],
    ingredients: [{ foodId: "potato_raw", grams: 800 }, { foodId: "onion", grams: 100 }, { foodId: "green_pepper", grams: 80 }, { foodId: "tomato_paste", grams: 30 }, { foodId: "oil", grams: 50 }, { foodId: "salt", grams: 10 }],
    waterG: 300, yield: { kind: "fndds", foodCode: 75649110 },
  },
  {
    id: "mantar_sote", name: "Mantar sote", category: "dish", aliases: ["mantar sote","mantar yemeği","sote mantar"], typicalPortionG: 150, portions: [{ unit: "porsiyon", grams: 150 }],
    ingredients: [{ foodId: "mushroom", grams: 500 }, { foodId: "onion", grams: 100 }, { foodId: "green_pepper", grams: 100 }, { foodId: "butter", grams: 30 }, { foodId: "oil", grams: 15 }, { foodId: "salt", grams: 6 }],
    yield: { kind: "fndds", foodCode: 99997515 },
  },
  {
    id: "cauliflower_fried", name: "Karnabahar kızartması", category: "dish", aliases: ["karnabahar kızartması","yumurtalı karnabahar"], typicalPortionG: 150, portions: [{ unit: "porsiyon", grams: 150 }],
    ingredients: [{ foodId: "cauliflower", grams: 600 }, { foodId: "egg", grams: 100 }, { foodId: "flour", grams: 60 }, { foodId: "sunflower_oil", grams: 100 }, { foodId: "salt", grams: 6 }],
    yield: { kind: "fndds", foodCode: 99997535 },
  },
  {
    id: "mucver", name: "Mücver", category: "dish", aliases: ["mücver","kabak mücveri"], typicalPortionG: 150, portions: [{ unit: "adet", grams: 50 }],
    ingredients: [{ foodId: "zucchini", grams: 600 }, { foodId: "egg", grams: 150 }, { foodId: "flour", grams: 80 }, { foodId: "white_cheese", grams: 100 }, { foodId: "dill", grams: 20 }, { foodId: "spring_onion", grams: 40 }, { foodId: "sunflower_oil", grams: 70 }, { foodId: "salt", grams: 5 }],
    yield: { kind: "fndds", foodCode: 75411020 },
  },
  {
    id: "fava", name: "Fava", category: "dish", aliases: ["fava","bakla ezmesi"], typicalPortionG: 100, portions: [{ unit: "dilim", grams: 80 }],
    ingredients: [{ foodId: "fava_dry", grams: 250 }, { foodId: "onion", grams: 100 }, { foodId: "oil", grams: 80 }, { foodId: "dill", grams: 15 }, { foodId: "sugar", grams: 5 }, { foodId: "salt", grams: 6 }],
    waterG: 700, yield: { kind: "fndds", foodCode: 41304990 },
  },
  {
    id: "yogurtlu_semizotu", name: "Yoğurtlu semizotu", category: "dish", aliases: ["yoğurtlu semizotu","semizotu salatası"], typicalPortionG: 150, portions: [{ unit: "kase", grams: 150 }],
    ingredients: [{ foodId: "purslane", grams: 300 }, { foodId: "yogurt", grams: 300 }, { foodId: "garlic", grams: 6 }, { foodId: "oil", grams: 15 }, { foodId: "salt", grams: 4 }],
    yield: { kind: "fndds", foodCode: 58175110 },
  },
  {
    id: "kabak_tatlisi", name: "Kabak tatlısı", category: "sweet", aliases: ["kabak tatlısı","bal kabağı tatlısı"], typicalPortionG: 150, portions: [{ unit: "dilim", grams: 120 }],
    ingredients: [{ foodId: "pumpkin", grams: 1000 }, { foodId: "sugar", grams: 300 }, { foodId: "walnuts", grams: 40 }],
    yield: { kind: "fndds", foodCode: 73201020 },
  },
  {
    id: "ayva_tatlisi", name: "Ayva tatlısı", category: "sweet", aliases: ["ayva tatlısı"], typicalPortionG: 200, portions: [{ unit: "adet", grams: 200 }],
    ingredients: [{ foodId: "quince", grams: 1000 }, { foodId: "sugar", grams: 300 }, { foodId: "lemon_juice", grams: 10 }],
    waterG: 300, yield: { kind: "fndds", foodCode: 63101310 },
  },
  {
    id: "profiterol", name: "Profiterol", category: "sweet", aliases: ["profiterol","profiterol tatlısı"], typicalPortionG: 150, portions: [{ unit: "kase", grams: 150 }],
    ingredients: [{ foodId: "flour", grams: 100 }, { foodId: "butter", grams: 80 }, { foodId: "egg", grams: 200 }, { foodId: "milk", grams: 500 }, { foodId: "sugar", grams: 100 }, { foodId: "cornstarch", grams: 40 }, { foodId: "semisweet_chocolate", grams: 100 }, { foodId: "cream_heavy", grams: 100 }],
    waterG: 200, yield: { kind: "fndds", foodCode: 53420200 },
  },
  {
    id: "trilece", name: "Trileçe", category: "sweet", aliases: ["trileçe","trileçe tatlısı"], typicalPortionG: 150, portions: [{ unit: "dilim", grams: 130 }],
    ingredients: [{ foodId: "egg", grams: 250 }, { foodId: "sugar", grams: 250 }, { foodId: "flour", grams: 150 }, { foodId: "baking_powder", grams: 5 }, { foodId: "milk", grams: 500 }, { foodId: "cream_heavy", grams: 200 }, { foodId: "milk_evaporated", grams: 100 }],
    yield: { kind: "fndds", foodCode: 53118550 },
  },
  {
    id: "kemalpasa", name: "Kemalpaşa tatlısı", category: "sweet", aliases: ["kemalpaşa","kemalpaşa tatlısı"], typicalPortionG: 100, portions: [{ unit: "adet", grams: 25 }],
    ingredients: [{ foodId: "flour", grams: 250 }, { foodId: "semolina", grams: 50 }, { foodId: "egg", grams: 100 }, { foodId: "cottage_cheese", grams: 100 }, { foodId: "baking_powder", grams: 5 }, { foodId: "sugar", grams: 500 }, { foodId: "lemon_juice", grams: 10 }],
    waterG: 600, yield: { kind: "fndds", foodCode: 53441110 },
  },
  {
    // Güllaç sheets are wheat starch and flour; corn starch and flour stand in.
    id: "gullac", name: "Güllaç", category: "sweet", aliases: ["güllaç","güllaç tatlısı"], typicalPortionG: 150, portions: [{ unit: "dilim", grams: 120 }],
    ingredients: [{ foodId: "milk", grams: 1500 }, { foodId: "sugar", grams: 300 }, { foodId: "cornstarch", grams: 75 }, { foodId: "flour", grams: 75 }, { foodId: "walnuts", grams: 100 }],
    yield: { kind: "fndds", foodCode: 13210280 },
  },
  {
    id: "cocoa_cake", name: "Kakaolu kek", category: "sweet", aliases: ["kakaolu kek","ev keki","çikolatalı kek"], typicalPortionG: 70, portions: [{ unit: "dilim", grams: 70 }],
    ingredients: [{ foodId: "flour", grams: 250 }, { foodId: "sugar", grams: 250 }, { foodId: "egg", grams: 150 }, { foodId: "milk", grams: 200 }, { foodId: "sunflower_oil", grams: 150 }, { foodId: "cocoa_powder", grams: 40 }, { foodId: "baking_powder", grams: 10 }],
    yield: { kind: "fndds", foodCode: 53105275 },
  },
  {
    id: "tuzlu_kurabiye", name: "Tuzlu kurabiye", category: "sweet", aliases: ["tuzlu kurabiye","kahvaltılık kurabiye"], typicalPortionG: 40, portions: [{ unit: "adet", grams: 15 }],
    ingredients: [{ foodId: "flour", grams: 400 }, { foodId: "butter", grams: 125 }, { foodId: "sunflower_oil", grams: 100 }, { foodId: "yogurt", grams: 100 }, { foodId: "egg", grams: 50 }, { foodId: "baking_powder", grams: 10 }, { foodId: "salt", grams: 8 }],
    yield: { kind: "fndds", foodCode: 53241500 },
  },
  {
    id: "un_kurabiyesi", name: "Un kurabiyesi", category: "sweet", aliases: ["un kurabiyesi","pudra şekerli kurabiye"], typicalPortionG: 40, portions: [{ unit: "adet", grams: 15 }],
    ingredients: [{ foodId: "flour", grams: 400 }, { foodId: "butter", grams: 250 }, { foodId: "powdered_sugar", grams: 120 }, { foodId: "cornstarch", grams: 50 }],
    yield: { kind: "fndds", foodCode: 53239000 },
  },
];
