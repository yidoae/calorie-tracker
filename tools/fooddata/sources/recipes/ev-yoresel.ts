// Ev yemekleri, çorbalar, yöresel yemekler, mezeler ve kahvaltılıklar (admin batch 1). Each yield
// is the FNDDS moisture change of the closest dish, as in the other recipe files.
export default [
  {
    id: "iskembe_soup", name: "İşkembe çorbası", category: "dish", aliases: ["işkembe çorbası","işkembe"], typicalPortionG: 300, portions: [{ unit: "kase", grams: 300 }],
    ingredients: [{ foodId: "tripe_raw", grams: 500 }, { foodId: "flour", grams: 30 }, { foodId: "butter", grams: 30 }, { foodId: "egg_yolk", grams: 40 }, { foodId: "lemon_juice", grams: 30 }, { foodId: "garlic", grams: 15 }, { foodId: "vinegar", grams: 30 }, { foodId: "salt", grams: 12 }],
    waterG: 1500, yield: { kind: "fndds", foodCode: 75652010 },
  },
  {
    // Tarhana is dried yoghurt, flour, tomato, pepper and onion; the soup uses those, unfermented.
    id: "tarhana_soup", name: "Tarhana çorbası", category: "dish", aliases: ["tarhana","tarhana çorbası"], typicalPortionG: 250, portions: [{ unit: "kase", grams: 250 }],
    ingredients: [{ foodId: "flour", grams: 60 }, { foodId: "yogurt", grams: 60 }, { foodId: "tomato_paste", grams: 20 }, { foodId: "onion", grams: 30 }, { foodId: "red_pepper", grams: 20 }, { foodId: "butter", grams: 20 }, { foodId: "salt", grams: 8 }],
    waterG: 1000, yield: { kind: "fndds", foodCode: 74601000 },
  },
  {
    id: "dugun_soup", name: "Düğün çorbası", category: "dish", aliases: ["düğün çorbası"], typicalPortionG: 250, portions: [{ unit: "kase", grams: 250 }],
    ingredients: [{ foodId: "lamb_leg_raw", grams: 250 }, { foodId: "flour", grams: 40 }, { foodId: "butter", grams: 30 }, { foodId: "egg_yolk", grams: 40 }, { foodId: "yogurt", grams: 100 }, { foodId: "lemon_juice", grams: 30 }, { foodId: "paprika", grams: 3 }, { foodId: "salt", grams: 10 }],
    waterG: 1500, yield: { kind: "fndds", foodCode: 75652010 },
  },
  {
    id: "green_lentil_stew", name: "Yeşil mercimek yemeği", category: "dish", aliases: ["yeşil mercimek yemeği","mercimek yemeği"], typicalPortionG: 250, portions: [{ unit: "kase", grams: 250 }],
    ingredients: [{ foodId: "lentils_dry", grams: 250 }, { foodId: "bulgur_dry", grams: 50 }, { foodId: "onion", grams: 100 }, { foodId: "tomato_paste", grams: 30 }, { foodId: "oil", grams: 40 }, { foodId: "salt", grams: 8 }],
    waterG: 1000, yield: { kind: "fndds", foodCode: 41304990 },
  },
  {
    id: "eksili_kofte", name: "Ekşili köfte", category: "dish", aliases: ["ekşili köfte","sulu köfte","terbiyeli köfte"], typicalPortionG: 300, portions: [{ unit: "kase", grams: 300 }],
    ingredients: [{ foodId: "beef_mince_raw", grams: 400 }, { foodId: "rice_raw", grams: 60 }, { foodId: "onion", grams: 80 }, { foodId: "potato_raw", grams: 200 }, { foodId: "carrot", grams: 100 }, { foodId: "tomato_paste", grams: 30 }, { foodId: "flour", grams: 20 }, { foodId: "egg_yolk", grams: 20 }, { foodId: "lemon_juice", grams: 30 }, { foodId: "salt", grams: 10 }],
    waterG: 1000, yield: { kind: "fndds", foodCode: 28310230 },
  },
  {
    id: "izmir_kofte", name: "İzmir köfte", category: "dish", aliases: ["izmir köfte","fırında köfte patates"], typicalPortionG: 300, portions: [{ unit: "porsiyon", grams: 300 }],
    ingredients: [{ foodId: "beef_mince_raw", grams: 500 }, { foodId: "bread_crumbs", grams: 40 }, { foodId: "onion", grams: 80 }, { foodId: "egg", grams: 50 }, { foodId: "potato_raw", grams: 500 }, { foodId: "green_pepper", grams: 150 }, { foodId: "tomato", grams: 300 }, { foodId: "tomato_paste", grams: 30 }, { foodId: "sunflower_oil", grams: 60 }, { foodId: "salt", grams: 10 }],
    waterG: 200, yield: { kind: "fndds", foodCode: 27411100 },
  },
  {
    id: "kadinbudu_kofte", name: "Kadınbudu köfte", category: "dish", aliases: ["kadınbudu","kadınbudu köfte"], typicalPortionG: 150, portions: [{ unit: "adet", grams: 50 }],
    ingredients: [{ foodId: "beef_mince_raw", grams: 500 }, { foodId: "rice_boiled", grams: 200 }, { foodId: "onion", grams: 80 }, { foodId: "egg", grams: 100 }, { foodId: "flour", grams: 40 }, { foodId: "sunflower_oil", grams: 80 }, { foodId: "salt", grams: 8 }],
    yield: { kind: "fndds", foodCode: 27118110 },
  },
  {
    id: "zucchini_dolma", name: "Etli kabak dolması", category: "dish", aliases: ["kabak dolması","etli kabak dolması"], typicalPortionG: 250, portions: [{ unit: "adet", grams: 120 }],
    ingredients: [{ foodId: "zucchini", grams: 1000 }, { foodId: "beef_mince_raw", grams: 250 }, { foodId: "rice_raw", grams: 120 }, { foodId: "onion", grams: 100 }, { foodId: "tomato_paste", grams: 30 }, { foodId: "oil", grams: 30 }, { foodId: "salt", grams: 10 }],
    waterG: 300, yield: { kind: "fndds", foodCode: 58162110 },
  },
  {
    id: "patlican_kebabi", name: "Patlıcan kebabı", category: "dish", aliases: ["patlıcan kebabı","fırın patlıcan kebabı"], typicalPortionG: 300, portions: [{ unit: "porsiyon", grams: 300 }],
    ingredients: [{ foodId: "eggplant", grams: 600 }, { foodId: "beef_mince_raw", grams: 500 }, { foodId: "tomato", grams: 300 }, { foodId: "green_pepper", grams: 100 }, { foodId: "onion", grams: 80 }, { foodId: "salt", grams: 10 }],
    yield: { kind: "fndds", foodCode: 77316600 },
  },
  {
    id: "saksuka", name: "Şakşuka", category: "dish", aliases: ["şakşuka","patlıcan kızartması"], typicalPortionG: 150, portions: [{ unit: "kase", grams: 150 }],
    ingredients: [{ foodId: "eggplant", grams: 600 }, { foodId: "zucchini", grams: 300 }, { foodId: "green_pepper", grams: 150 }, { foodId: "tomato", grams: 300 }, { foodId: "sunflower_oil", grams: 120 }, { foodId: "garlic", grams: 10 }, { foodId: "salt", grams: 8 }],
    yield: { kind: "fndds", foodCode: 75217020 },
  },
  {
    id: "hamsili_pilav", name: "Hamsili pilav", category: "dish", aliases: ["hamsili pilav","hamsi pilavı"], typicalPortionG: 250, portions: [{ unit: "dilim", grams: 200 }],
    ingredients: [{ foodId: "anchovy_raw", grams: 500 }, { foodId: "rice_raw", grams: 300 }, { foodId: "butter", grams: 50 }, { foodId: "onion", grams: 80 }, { foodId: "pine_nuts", grams: 20 }, { foodId: "raisins", grams: 20 }, { foodId: "salt", grams: 10 }],
    waterG: 450, yield: { kind: "fndds", foodCode: 56205004 },
  },
  {
    id: "icli_kofte", name: "İçli köfte", category: "dish", aliases: ["içli köfte","oruk"], typicalPortionG: 150, portions: [{ unit: "adet", grams: 60 }],
    ingredients: [{ foodId: "bulgur_dry", grams: 300 }, { foodId: "semolina", grams: 100 }, { foodId: "beef_mince_raw", grams: 350 }, { foodId: "onion", grams: 150 }, { foodId: "walnuts", grams: 50 }, { foodId: "paprika", grams: 5 }, { foodId: "sunflower_oil", grams: 100 }, { foodId: "salt", grams: 10 }],
    waterG: 200, yield: { kind: "fndds", foodCode: 58117310 },
  },
  {
    id: "ispanakli_yumurta", name: "Ispanaklı yumurta", category: "dish", aliases: ["ıspanaklı yumurta"], typicalPortionG: 250, portions: [{ unit: "porsiyon", grams: 250 }],
    ingredients: [{ foodId: "spinach_raw", grams: 400 }, { foodId: "egg", grams: 150 }, { foodId: "onion", grams: 80 }, { foodId: "oil", grams: 30 }, { foodId: "salt", grams: 5 }],
    yield: { kind: "fndds", foodCode: 32130460 },
  },
  {
    id: "cheese_omelet", name: "Kaşarlı omlet", category: "dish", aliases: ["kaşarlı omlet","peynirli omlet"], typicalPortionG: 150, portions: [{ unit: "porsiyon", grams: 150 }],
    ingredients: [{ foodId: "egg", grams: 150 }, { foodId: "kasar_cheese", grams: 40 }, { foodId: "milk", grams: 20 }, { foodId: "butter", grams: 10 }],
    yield: { kind: "fndds", foodCode: 32130010 },
  },
  {
    id: "crepe", name: "Krep", category: "dish", aliases: ["krep","sade krep"], typicalPortionG: 100, portions: [{ unit: "adet", grams: 50 }],
    ingredients: [{ foodId: "flour", grams: 125 }, { foodId: "milk", grams: 300 }, { foodId: "egg", grams: 100 }, { foodId: "butter", grams: 20 }, { foodId: "sugar", grams: 10 }],
    yield: { kind: "fndds", foodCode: 55401000 },
  },
  {
    id: "tahin_pekmez", name: "Tahin pekmez", category: "sweet", aliases: ["tahin pekmez","tahinli pekmez"], typicalPortionG: 40, portions: [{ unit: "yemek kaşığı", grams: 20 }],
    ingredients: [{ foodId: "tahini", grams: 100 }, { foodId: "molasses", grams: 100 }],
    yield: { kind: "fndds", foodCode: 58175110 },
  },
  {
    id: "muhammara", name: "Muhammara (acuka)", category: "dish", aliases: ["muhammara","acuka","cevizli biber"], typicalPortionG: 50, portions: [{ unit: "yemek kaşığı", grams: 20 }],
    ingredients: [{ foodId: "red_pepper", grams: 300 }, { foodId: "walnuts", grams: 100 }, { foodId: "bread_crumbs", grams: 50 }, { foodId: "tomato_paste", grams: 30 }, { foodId: "oil", grams: 50 }, { foodId: "molasses", grams: 15 }, { foodId: "cumin", grams: 3 }, { foodId: "salt", grams: 5 }],
    yield: { kind: "fndds", foodCode: 58175110 },
  },
  {
    id: "acili_ezme", name: "Acılı ezme", category: "dish", aliases: ["acılı ezme","ezme","ezme salata"], typicalPortionG: 80, portions: [{ unit: "yemek kaşığı", grams: 20 }],
    ingredients: [{ foodId: "tomato", grams: 300 }, { foodId: "green_pepper", grams: 100 }, { foodId: "onion", grams: 80 }, { foodId: "parsley", grams: 30 }, { foodId: "tomato_paste", grams: 20 }, { foodId: "oil", grams: 30 }, { foodId: "lemon_juice", grams: 20 }, { foodId: "paprika", grams: 3 }, { foodId: "salt", grams: 5 }],
    yield: { kind: "fndds", foodCode: 58175110 },
  },
  {
    id: "eggplant_salad", name: "Patlıcan salatası", category: "dish", aliases: ["patlıcan salatası","köz patlıcan","közlenmiş patlıcan"], typicalPortionG: 100, portions: [{ unit: "yemek kaşığı", grams: 25 }],
    ingredients: [{ foodId: "eggplant", grams: 800 }, { foodId: "oil", grams: 40 }, { foodId: "garlic", grams: 8 }, { foodId: "lemon_juice", grams: 20 }, { foodId: "salt", grams: 5 }],
    yield: { kind: "fndds", foodCode: 75217020 },
  },
];
