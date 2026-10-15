// Etli yemekler: FNDDS meat-and-vegetable dishes use cooked meat (moisture change about −5 %), so
// these recipes start from the USDA cooked meat and raw vegetables.
export default [
  {
    id: "kuru_fasulye", name: "Kuru fasulye (etli)", category: "dish", aliases: ["kuru fasulye","etli kuru fasulye","kuru fasulye yemeği"], typicalPortionG: 250, portions: [{ unit: "kase", grams: 250 }],
    ingredients: [{ foodId: "white_beans_boiled", grams: 900 }, { foodId: "beef_stew_cooked", grams: 150 }, { foodId: "onion", grams: 150 }, { foodId: "tomato_paste", grams: 40 }, { foodId: "oil", grams: 30 }, { foodId: "butter", grams: 15 }, { foodId: "salt", grams: 10 }],
    waterG: 400, yield: { kind: "fndds", foodCode: 41601010 },
  },
  {
    id: "chickpea_stew", name: "Etli nohut", category: "dish", aliases: ["etli nohut","nohut yemeği"], typicalPortionG: 250, portions: [{ unit: "kase", grams: 250 }],
    ingredients: [{ foodId: "chickpeas_boiled", grams: 900 }, { foodId: "beef_stew_cooked", grams: 150 }, { foodId: "onion", grams: 150 }, { foodId: "tomato_paste", grams: 40 }, { foodId: "oil", grams: 30 }, { foodId: "salt", grams: 10 }],
    waterG: 400, yield: { kind: "fndds", foodCode: 41601010 },
  },
  {
    id: "meat_peas", name: "Etli bezelye", category: "dish", aliases: ["etli bezelye"], typicalPortionG: 250, portions: [{ unit: "porsiyon", grams: 250 }],
    ingredients: [{ foodId: "peas_frozen", grams: 600 }, { foodId: "beef_stew_cooked", grams: 200 }, { foodId: "potato_raw", grams: 200 }, { foodId: "carrot", grams: 120 }, { foodId: "onion", grams: 100 }, { foodId: "tomato_paste", grams: 25 }, { foodId: "oil", grams: 30 }, { foodId: "salt", grams: 8 }],
    waterG: 300, yield: { kind: "fndds", foodCode: 27411100 },
  },
  {
    id: "meat_green_beans", name: "Etli taze fasulye", category: "dish", aliases: ["etli taze fasulye","etli fasulye"], typicalPortionG: 250, portions: [{ unit: "porsiyon", grams: 250 }],
    ingredients: [{ foodId: "green_beans", grams: 800 }, { foodId: "beef_stew_cooked", grams: 200 }, { foodId: "onion", grams: 150 }, { foodId: "tomato", grams: 250 }, { foodId: "tomato_paste", grams: 20 }, { foodId: "oil", grams: 30 }, { foodId: "salt", grams: 8 }],
    waterG: 200, yield: { kind: "fndds", foodCode: 27411100 },
  },
  {
    id: "meat_okra", name: "Etli bamya", category: "dish", aliases: ["etli bamya"], typicalPortionG: 250, portions: [{ unit: "porsiyon", grams: 250 }],
    ingredients: [{ foodId: "okra", grams: 600 }, { foodId: "lamb_leg_cooked", grams: 200 }, { foodId: "onion", grams: 120 }, { foodId: "tomato", grams: 300 }, { foodId: "butter", grams: 25 }, { foodId: "lemon_juice", grams: 30 }, { foodId: "salt", grams: 8 }],
    waterG: 250, yield: { kind: "fndds", foodCode: 27330060 },
  },
  {
    id: "turlu", name: "Türlü", category: "dish", aliases: ["türlü","sebze türlü","etli türlü"], typicalPortionG: 300, portions: [{ unit: "porsiyon", grams: 300 }],
    ingredients: [{ foodId: "eggplant", grams: 300 }, { foodId: "zucchini", grams: 300 }, { foodId: "green_beans", grams: 200 }, { foodId: "potato_raw", grams: 250 }, { foodId: "green_pepper", grams: 120 }, { foodId: "tomato", grams: 300 }, { foodId: "onion", grams: 150 }, { foodId: "beef_stew_cooked", grams: 200 }, { foodId: "oil", grams: 50 }, { foodId: "salt", grams: 10 }],
    waterG: 200, yield: { kind: "fndds", foodCode: 27411100 },
  },
  {
    id: "tas_kebabi", name: "Tas kebabı", category: "dish", aliases: ["tas kebabı","et sote","etli patates"], typicalPortionG: 250, portions: [{ unit: "porsiyon", grams: 250 }],
    ingredients: [{ foodId: "beef_stew_cooked", grams: 500 }, { foodId: "potato_raw", grams: 300 }, { foodId: "onion", grams: 200 }, { foodId: "tomato", grams: 200 }, { foodId: "tomato_paste", grams: 30 }, { foodId: "butter", grams: 30 }, { foodId: "salt", grams: 8 }],
    waterG: 200, yield: { kind: "fndds", foodCode: 27411100 },
  },
  {
    id: "orman_kebabi", name: "Orman kebabı", category: "dish", aliases: ["orman kebabı"], typicalPortionG: 300, portions: [{ unit: "porsiyon", grams: 300 }],
    ingredients: [{ foodId: "lamb_leg_cooked", grams: 500 }, { foodId: "potato_raw", grams: 300 }, { foodId: "carrot", grams: 150 }, { foodId: "peas_frozen", grams: 150 }, { foodId: "onion", grams: 150 }, { foodId: "butter", grams: 30 }, { foodId: "salt", grams: 8 }],
    waterG: 200, yield: { kind: "fndds", foodCode: 27330060 },
  },
  {
    id: "hunkar_begendi", name: "Hünkar beğendi", category: "dish", aliases: ["hünkar beğendi","beğendili kebap"], typicalPortionG: 300, portions: [{ unit: "porsiyon", grams: 300 }],
    ingredients: [{ foodId: "lamb_leg_cooked", grams: 400 }, { foodId: "eggplant", grams: 700 }, { foodId: "milk", grams: 400 }, { foodId: "butter", grams: 60 }, { foodId: "flour", grams: 40 }, { foodId: "kasar_cheese", grams: 60 }, { foodId: "tomato", grams: 200 }, { foodId: "onion", grams: 100 }, { foodId: "salt", grams: 10 }],
    yield: { kind: "fndds", foodCode: 77316600 },
  },
  {
    id: "karniyarik", name: "Karnıyarık", category: "dish", aliases: ["karnıyarık"], typicalPortionG: 300, portions: [{ unit: "adet", grams: 250 }],
    ingredients: [{ foodId: "eggplant", grams: 1000 }, { foodId: "beef_mince_cooked", grams: 250 }, { foodId: "onion", grams: 200 }, { foodId: "tomato", grams: 300 }, { foodId: "green_pepper", grams: 100 }, { foodId: "tomato_paste", grams: 20 }, { foodId: "oil", grams: 120 }, { foodId: "salt", grams: 10 }],
    yield: { kind: "fndds", foodCode: 77316600 },
  },
  {
    id: "musakka", name: "Patlıcan musakka", category: "dish", aliases: ["musakka","patlıcan musakka"], typicalPortionG: 250, portions: [{ unit: "porsiyon", grams: 250 }],
    ingredients: [{ foodId: "eggplant", grams: 900 }, { foodId: "beef_mince_cooked", grams: 250 }, { foodId: "onion", grams: 150 }, { foodId: "tomato", grams: 300 }, { foodId: "green_pepper", grams: 80 }, { foodId: "oil", grams: 100 }, { foodId: "salt", grams: 10 }],
    waterG: 150, yield: { kind: "fndds", foodCode: 77316600 },
  },
  {
    id: "ali_nazik", name: "Ali nazik", category: "dish", aliases: ["ali nazik"], typicalPortionG: 300, portions: [{ unit: "porsiyon", grams: 300 }],
    ingredients: [{ foodId: "eggplant", grams: 600 }, { foodId: "yogurt", grams: 400 }, { foodId: "garlic", grams: 10 }, { foodId: "lamb_mince_cooked", grams: 300 }, { foodId: "butter", grams: 40 }, { foodId: "salt", grams: 8 }],
    yield: { kind: "fndds", foodCode: 77316600 },
  },
  {
    id: "meat_pepper_dolma", name: "Etli biber dolması", category: "dish", aliases: ["etli biber dolması","etli dolma"], typicalPortionG: 250, portions: [{ unit: "adet", grams: 120 }],
    ingredients: [{ foodId: "green_pepper", grams: 600 }, { foodId: "beef_mince_raw", grams: 300 }, { foodId: "rice_raw", grams: 150 }, { foodId: "onion", grams: 150 }, { foodId: "tomato", grams: 150 }, { foodId: "tomato_paste", grams: 25 }, { foodId: "oil", grams: 30 }, { foodId: "mint", grams: 5 }, { foodId: "salt", grams: 8 }],
    waterG: 400, yield: { kind: "fndds", foodCode: 58162110 },
  },
  {
    id: "meat_sarma", name: "Etli yaprak sarma", category: "dish", aliases: ["etli sarma","etli yaprak sarma"], typicalPortionG: 200, portions: [{ unit: "adet", grams: 25 }],
    ingredients: [{ foodId: "grape_leaves", grams: 250 }, { foodId: "beef_mince_raw", grams: 400 }, { foodId: "rice_raw", grams: 200 }, { foodId: "onion", grams: 200 }, { foodId: "tomato_paste", grams: 25 }, { foodId: "oil", grams: 30 }, { foodId: "mint", grams: 5 }, { foodId: "salt", grams: 8 }],
    waterG: 500, yield: { kind: "fndds", foodCode: 27315270 },
  },
  {
    id: "minced_spinach", name: "Kıymalı ıspanak", category: "dish", aliases: ["kıymalı ıspanak"], typicalPortionG: 250, portions: [{ unit: "porsiyon", grams: 250 }],
    ingredients: [{ foodId: "spinach_raw", grams: 1000 }, { foodId: "beef_mince_cooked", grams: 200 }, { foodId: "onion", grams: 150 }, { foodId: "rice_raw", grams: 40 }, { foodId: "tomato_paste", grams: 20 }, { foodId: "oil", grams: 30 }, { foodId: "salt", grams: 8 }],
    waterG: 150, yield: { kind: "fndds", foodCode: 72125221 },
  },
  {
    id: "minced_potato", name: "Kıymalı patates", category: "dish", aliases: ["kıymalı patates","patates oturtma"], typicalPortionG: 250, portions: [{ unit: "porsiyon", grams: 250 }],
    ingredients: [{ foodId: "potato_raw", grams: 800 }, { foodId: "beef_mince_cooked", grams: 200 }, { foodId: "onion", grams: 150 }, { foodId: "tomato_paste", grams: 30 }, { foodId: "green_pepper", grams: 80 }, { foodId: "oil", grams: 40 }, { foodId: "salt", grams: 8 }],
    waterG: 300, yield: { kind: "fndds", foodCode: 27411100 },
  },
  {
    id: "chicken_saute", name: "Tavuk sote", category: "dish", aliases: ["sebzeli tavuk","sote tavuk","tavuk sote","tavuk tava"], typicalPortionG: 250, portions: [{ unit: "kase", grams: 250 }],
    ingredients: [{ foodId: "chicken_breast_grilled", grams: 500 }, { foodId: "green_pepper", grams: 150 }, { foodId: "red_pepper", grams: 150 }, { foodId: "tomato", grams: 250 }, { foodId: "onion", grams: 150 }, { foodId: "mushroom", grams: 150 }, { foodId: "oil", grams: 40 }, { foodId: "salt", grams: 8 }],
    yield: { kind: "fndds", foodCode: 27341020 },
  },
  {
    id: "oven_chicken_potato", name: "Fırında patatesli tavuk", category: "dish", aliases: ["fırında patatesli tavuk","tavuk patates fırın"], typicalPortionG: 350, portions: [{ unit: "porsiyon", grams: 350 }],
    ingredients: [{ foodId: "chicken_thigh", grams: 600 }, { foodId: "potato_raw", grams: 700 }, { foodId: "onion", grams: 150 }, { foodId: "green_pepper", grams: 100 }, { foodId: "tomato", grams: 200 }, { foodId: "oil", grams: 50 }, { foodId: "tomato_paste", grams: 20 }, { foodId: "salt", grams: 10 }],
    yield: { kind: "fndds", foodCode: 27341020 },
  },
  {
    id: "stir_fry_veg", name: "Sebze sote", category: "dish", aliases: ["sebze","sebze sote","sote sebze","vegetables"], typicalPortionG: 150,
    ingredients: [{ foodId: "zucchini", grams: 300 }, { foodId: "carrot", grams: 200 }, { foodId: "broccoli", grams: 200 }, { foodId: "red_pepper", grams: 150 }, { foodId: "onion", grams: 100 }, { foodId: "mushroom", grams: 150 }, { foodId: "oil", grams: 50 }, { foodId: "salt", grams: 6 }],
    yield: { kind: "fndds", foodCode: 75211031 },
  },
];
