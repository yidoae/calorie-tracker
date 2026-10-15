// Salatalar, mezeler, tatlılar ve ayran. Uncooked salads and mezes keep their weight (FNDDS 0 %
// codes); baked and fried sweets use the FNDDS codes of the closest dessert.
export default [
  {
    id: "coban_salata", name: "Çoban salata", category: "dish", aliases: ["çoban salata","çoban salatası"], typicalPortionG: 200, portions: [{ unit: "kase", grams: 200 }],
    ingredients: [{ foodId: "tomato", grams: 400 }, { foodId: "cucumber", grams: 300 }, { foodId: "green_pepper", grams: 100 }, { foodId: "onion", grams: 80 }, { foodId: "parsley", grams: 30 }, { foodId: "oil", grams: 30 }, { foodId: "lemon_juice", grams: 30 }, { foodId: "salt", grams: 5 }],
    yield: { kind: "fndds", foodCode: 58175110 },
  },
  {
    id: "cacik", name: "Cacık", category: "dish", aliases: ["cacık"], typicalPortionG: 200, portions: [{ unit: "kase", grams: 200 }],
    ingredients: [{ foodId: "yogurt", grams: 500 }, { foodId: "cucumber", grams: 250 }, { foodId: "garlic", grams: 8 }, { foodId: "dried_mint", grams: 2 }, { foodId: "oil", grams: 10 }, { foodId: "salt", grams: 5 }],
    waterG: 200, yield: { kind: "fndds", foodCode: 58175110 },
  },
  {
    id: "haydari", name: "Haydari", category: "dish", aliases: ["haydari"], typicalPortionG: 60, portions: [{ unit: "yemek kaşığı", grams: 20 }],
    ingredients: [{ foodId: "yogurt_greek", grams: 400 }, { foodId: "white_cheese", grams: 60 }, { foodId: "garlic", grams: 8 }, { foodId: "dill", grams: 10 }, { foodId: "mint", grams: 5 }, { foodId: "oil", grams: 20 }, { foodId: "salt", grams: 3 }],
    yield: { kind: "fndds", foodCode: 58175110 },
  },
  {
    id: "piyaz", name: "Piyaz", category: "dish", aliases: ["piyaz","fasulye piyazı"], typicalPortionG: 200, portions: [{ unit: "kase", grams: 200 }],
    ingredients: [{ foodId: "white_beans_boiled", grams: 600 }, { foodId: "onion", grams: 150 }, { foodId: "tomato", grams: 150 }, { foodId: "parsley", grams: 40 }, { foodId: "egg_boiled", grams: 100 }, { foodId: "oil", grams: 50 }, { foodId: "vinegar", grams: 30 }, { foodId: "tahini", grams: 30 }, { foodId: "salt", grams: 6 }],
    yield: { kind: "fndds", foodCode: 58175110 },
  },
  {
    id: "kisir", name: "Kısır", category: "dish", aliases: ["kısır"], typicalPortionG: 200, portions: [{ unit: "kase", grams: 200 }],
    ingredients: [{ foodId: "bulgur_cooked", grams: 700 }, { foodId: "tomato_paste", grams: 40 }, { foodId: "onion", grams: 80 }, { foodId: "spring_onion", grams: 60 }, { foodId: "parsley", grams: 60 }, { foodId: "mint", grams: 20 }, { foodId: "lemon_juice", grams: 40 }, { foodId: "oil", grams: 60 }, { foodId: "paprika", grams: 5 }, { foodId: "salt", grams: 6 }],
    yield: { kind: "fndds", foodCode: 58175110 },
  },
  {
    id: "gavurdagi", name: "Gavurdağı salatası", category: "dish", aliases: ["gavurdağı","gavurdağı salatası"], typicalPortionG: 200, portions: [{ unit: "kase", grams: 200 }],
    ingredients: [{ foodId: "tomato", grams: 400 }, { foodId: "onion", grams: 100 }, { foodId: "green_pepper", grams: 100 }, { foodId: "parsley", grams: 30 }, { foodId: "walnuts", grams: 60 }, { foodId: "oil", grams: 40 }, { foodId: "molasses", grams: 20 }, { foodId: "lemon_juice", grams: 20 }, { foodId: "salt", grams: 5 }],
    yield: { kind: "fndds", foodCode: 58175110 },
  },
  {
    id: "mercimek_koftesi", name: "Mercimek köftesi", category: "dish", aliases: ["mercimek köftesi"], typicalPortionG: 150, portions: [{ unit: "adet", grams: 25 }],
    ingredients: [{ foodId: "red_lentils_boiled", grams: 500 }, { foodId: "bulgur_cooked", grams: 400 }, { foodId: "onion", grams: 150 }, { foodId: "tomato_paste", grams: 40 }, { foodId: "oil", grams: 60 }, { foodId: "spring_onion", grams: 60 }, { foodId: "parsley", grams: 40 }, { foodId: "lemon_juice", grams: 20 }, { foodId: "cumin", grams: 4 }, { foodId: "salt", grams: 8 }],
    yield: { kind: "fndds", foodCode: 58175110 },
  },
  {
    id: "cig_kofte", name: "Çiğ köfte (etsiz)", category: "dish", aliases: ["çiğ köfte","etsiz çiğ köfte"], typicalPortionG: 150, portions: [{ unit: "adet", grams: 25 }, { unit: "dürüm", grams: 250 }],
    ingredients: [{ foodId: "bulgur_dry", grams: 500 }, { foodId: "onion", grams: 200 }, { foodId: "tomato_paste", grams: 80 }, { foodId: "paprika", grams: 40 }, { foodId: "molasses", grams: 30 }, { foodId: "lemon_juice", grams: 30 }, { foodId: "oil", grams: 80 }, { foodId: "parsley", grams: 60 }, { foodId: "salt", grams: 10 }],
    waterG: 350, yield: { kind: "fndds", foodCode: 58175110 },
  },
  {
    id: "potato_salad", name: "Patates salatası", category: "dish", aliases: ["patates salatası"], typicalPortionG: 200, portions: [{ unit: "kase", grams: 200 }],
    ingredients: [{ foodId: "potato", grams: 800 }, { foodId: "spring_onion", grams: 60 }, { foodId: "parsley", grams: 40 }, { foodId: "dill", grams: 15 }, { foodId: "oil", grams: 50 }, { foodId: "lemon_juice", grams: 30 }, { foodId: "salt", grams: 6 }],
    yield: { kind: "fndds", foodCode: 71601010 },
  },
  {
    id: "carrot_tarator", name: "Havuç tarator", category: "dish", aliases: ["havuç tarator","yoğurtlu havuç"], typicalPortionG: 100, portions: [{ unit: "yemek kaşığı", grams: 25 }],
    ingredients: [{ foodId: "carrot", grams: 400 }, { foodId: "yogurt_greek", grams: 300 }, { foodId: "garlic", grams: 6 }, { foodId: "oil", grams: 30 }, { foodId: "walnuts", grams: 30 }, { foodId: "salt", grams: 4 }],
    yield: { kind: "fndds", foodCode: 58175110 },
  },
  {
    id: "falafel", name: "Falafel", category: "dish", aliases: ["falafel"], typicalPortionG: 100, portions: [{ unit: "adet", grams: 17 }],
    ingredients: [{ foodId: "chickpeas_boiled", grams: 600 }, { foodId: "onion", grams: 100 }, { foodId: "parsley", grams: 40 }, { foodId: "garlic", grams: 10 }, { foodId: "flour", grams: 40 }, { foodId: "cumin", grams: 5 }, { foodId: "sunflower_oil", grams: 120 }, { foodId: "salt", grams: 8 }],
    yield: { kind: "fndds", foodCode: 41209000 },
  },
  {
    id: "sutlac", name: "Sütlaç", category: "sweet", aliases: ["sütlaç","fırın sütlaç"], typicalPortionG: 200, portions: [{ unit: "kase", grams: 200 }],
    ingredients: [{ foodId: "milk", grams: 1000 }, { foodId: "rice_raw", grams: 80 }, { foodId: "sugar", grams: 150 }, { foodId: "cornstarch", grams: 25 }],
    waterG: 200, yield: { kind: "fndds", foodCode: 13210410 },
  },
  {
    id: "muhallebi", name: "Muhallebi", category: "sweet", aliases: ["muhallebi","puding","sütlü tatlı"], typicalPortionG: 150, portions: [{ unit: "kase", grams: 150 }],
    ingredients: [{ foodId: "milk", grams: 1000 }, { foodId: "sugar", grams: 150 }, { foodId: "cornstarch", grams: 50 }, { foodId: "flour", grams: 20 }],
    yield: { kind: "fndds", foodCode: 13210410 },
  },
  {
    id: "chocolate_pudding", name: "Kakaolu puding", category: "sweet", aliases: ["kakaolu puding","çikolatalı puding"], typicalPortionG: 150, portions: [{ unit: "kase", grams: 150 }],
    ingredients: [{ foodId: "milk", grams: 1000 }, { foodId: "sugar", grams: 150 }, { foodId: "cornstarch", grams: 45 }, { foodId: "cocoa_powder", grams: 30 }, { foodId: "butter", grams: 15 }],
    yield: { kind: "fndds", foodCode: 13200110 },
  },
  {
    id: "baklava", name: "Baklava (cevizli)", category: "sweet", aliases: ["baklava","cevizli baklava"], typicalPortionG: 90, portions: [{ unit: "adet", grams: 30 }, { unit: "dilim", grams: 30 }],
    ingredients: [{ foodId: "phyllo", grams: 500 }, { foodId: "walnuts", grams: 300 }, { foodId: "butter", grams: 300 }, { foodId: "sugar", grams: 600 }, { foodId: "lemon_juice", grams: 15 }],
    waterG: 450, yield: { kind: "fndds", foodCode: 53441110 },
  },
  {
    id: "revani", name: "Revani", category: "sweet", aliases: ["revani"], typicalPortionG: 100, portions: [{ unit: "dilim", grams: 80 }],
    ingredients: [{ foodId: "semolina", grams: 200 }, { foodId: "flour", grams: 100 }, { foodId: "egg", grams: 200 }, { foodId: "sugar", grams: 450 }, { foodId: "yogurt", grams: 150 }, { foodId: "oil", grams: 80 }, { foodId: "baking_powder", grams: 10 }],
    waterG: 450, yield: { kind: "fndds", foodCode: 53118100 },
  },
  {
    id: "irmik_helvasi", name: "İrmik helvası", category: "sweet", aliases: ["irmik helvası","helva tatlısı"], typicalPortionG: 100, portions: [{ unit: "kase", grams: 120 }],
    ingredients: [{ foodId: "semolina", grams: 300 }, { foodId: "butter", grams: 120 }, { foodId: "milk", grams: 500 }, { foodId: "sugar", grams: 250 }, { foodId: "pine_nuts", grams: 30 }],
    waterG: 200, yield: { kind: "fndds", foodCode: 13210410 },
  },
  {
    id: "lokma", name: "Lokma", category: "sweet", aliases: ["lokma","lokma tatlısı"], typicalPortionG: 100, portions: [{ unit: "adet", grams: 15 }],
    ingredients: [{ foodId: "flour", grams: 500 }, { foodId: "yeast", grams: 10 }, { foodId: "sunflower_oil", grams: 250 }, { foodId: "sugar", grams: 600 }, { foodId: "lemon_juice", grams: 15 }],
    waterG: 900, yield: { kind: "fndds", foodCode: 53415110 },
  },
  {
    id: "ayran", name: "Ayran", category: "drink", aliases: ["ayran"], typicalPortionG: 200, portions: [{ unit: "su bardağı", grams: 200 }],
    ingredients: [{ foodId: "yogurt", grams: 500 }, { foodId: "salt", grams: 5 }],
    waterG: 500, yield: { kind: "fndds", foodCode: 58175110 },
  },
];
