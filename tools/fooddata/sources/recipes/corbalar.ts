// Çorbalar: typical home recipes for one pot. FNDDS soups have a 0 % moisture change, so `waterG` is
// the water left in the finished pot (research §2); values per 100 g follow from the ingredients.
export default [
  {
    id: "lentil_soup", name: "Mercimek çorbası", category: "dish", aliases: ["mercimek çorbası","çorba","kırmızı mercimek çorbası"], typicalPortionG: 250, portions: [{ unit: "kase", grams: 250 }],
    ingredients: [{ foodId: "lentils_dry", grams: 200 }, { foodId: "onion", grams: 100 }, { foodId: "carrot", grams: 60 }, { foodId: "potato_raw", grams: 100 }, { foodId: "butter", grams: 30 }, { foodId: "flour", grams: 15 }, { foodId: "tomato_paste", grams: 20 }, { foodId: "salt", grams: 10 }],
    waterG: 1400, yield: { kind: "fndds", foodCode: 41603010 },
  },
  {
    id: "ezogelin_soup", name: "Ezogelin çorbası", category: "dish", aliases: ["ezogelin","ezogelin çorbası"], typicalPortionG: 250, portions: [{ unit: "kase", grams: 250 }],
    ingredients: [{ foodId: "lentils_dry", grams: 150 }, { foodId: "bulgur_dry", grams: 40 }, { foodId: "rice_raw", grams: 30 }, { foodId: "onion", grams: 100 }, { foodId: "butter", grams: 30 }, { foodId: "tomato_paste", grams: 30 }, { foodId: "dried_mint", grams: 3 }, { foodId: "paprika", grams: 3 }, { foodId: "salt", grams: 10 }],
    waterG: 1400, yield: { kind: "fndds", foodCode: 41603010 },
  },
  {
    id: "yayla_soup", name: "Yayla çorbası", category: "dish", aliases: ["yayla çorbası","yoğurt çorbası"], typicalPortionG: 250, portions: [{ unit: "kase", grams: 250 }],
    ingredients: [{ foodId: "yogurt", grams: 500 }, { foodId: "rice_raw", grams: 60 }, { foodId: "egg_yolk", grams: 17 }, { foodId: "flour", grams: 20 }, { foodId: "butter", grams: 20 }, { foodId: "dried_mint", grams: 3 }, { foodId: "salt", grams: 8 }],
    waterG: 900, yield: { kind: "fndds", foodCode: 75649110 },
  },
  {
    id: "tomato_soup", name: "Domates çorbası", category: "dish", aliases: ["domates çorbası"], typicalPortionG: 250, portions: [{ unit: "kase", grams: 250 }],
    ingredients: [{ foodId: "tomato", grams: 800 }, { foodId: "tomato_paste", grams: 30 }, { foodId: "flour", grams: 30 }, { foodId: "butter", grams: 30 }, { foodId: "milk", grams: 200 }, { foodId: "salt", grams: 8 }],
    waterG: 600, yield: { kind: "fndds", foodCode: 74601000 },
  },
  {
    id: "chicken_noodle_soup", name: "Şehriyeli tavuk çorbası", category: "dish", aliases: ["tavuk çorbası","şehriyeli tavuk çorbası","tavuk suyu çorba"], typicalPortionG: 250, portions: [{ unit: "kase", grams: 250 }],
    ingredients: [{ foodId: "chicken_boiled", grams: 150 }, { foodId: "pasta_dry", grams: 60 }, { foodId: "carrot", grams: 50 }, { foodId: "butter", grams: 15 }, { foodId: "lemon_juice", grams: 15 }, { foodId: "salt", grams: 8 }],
    waterG: 1500, yield: { kind: "fndds", foodCode: 58403040 },
  },
  {
    id: "vegetable_soup", name: "Sebze çorbası", category: "dish", aliases: ["sebze çorbası"], typicalPortionG: 250, portions: [{ unit: "kase", grams: 250 }],
    ingredients: [{ foodId: "potato_raw", grams: 200 }, { foodId: "carrot", grams: 150 }, { foodId: "zucchini", grams: 150 }, { foodId: "onion", grams: 100 }, { foodId: "peas_frozen", grams: 80 }, { foodId: "tomato_paste", grams: 20 }, { foodId: "oil", grams: 25 }, { foodId: "salt", grams: 8 }],
    waterG: 1200, yield: { kind: "fndds", foodCode: 75649110 },
  },
  {
    id: "mushroom_soup", name: "Kremalı mantar çorbası", category: "dish", aliases: ["mantar çorbası","kremalı mantar çorbası"], typicalPortionG: 250, portions: [{ unit: "kase", grams: 250 }],
    ingredients: [{ foodId: "mushroom", grams: 400 }, { foodId: "onion", grams: 80 }, { foodId: "butter", grams: 30 }, { foodId: "flour", grams: 30 }, { foodId: "milk", grams: 400 }, { foodId: "cream_heavy", grams: 100 }, { foodId: "salt", grams: 8 }],
    waterG: 600, yield: { kind: "fndds", foodCode: 75649110 },
  },
  {
    id: "potato_soup", name: "Patates çorbası", category: "dish", aliases: ["patates çorbası"], typicalPortionG: 250, portions: [{ unit: "kase", grams: 250 }],
    ingredients: [{ foodId: "potato_raw", grams: 600 }, { foodId: "onion", grams: 100 }, { foodId: "carrot", grams: 80 }, { foodId: "butter", grams: 30 }, { foodId: "milk", grams: 300 }, { foodId: "salt", grams: 8 }],
    waterG: 800, yield: { kind: "fndds", foodCode: 71801000 },
  },
  {
    id: "broccoli_soup", name: "Kremalı brokoli çorbası", category: "dish", aliases: ["brokoli çorbası"], typicalPortionG: 250, portions: [{ unit: "kase", grams: 250 }],
    ingredients: [{ foodId: "broccoli", grams: 500 }, { foodId: "onion", grams: 80 }, { foodId: "butter", grams: 25 }, { foodId: "flour", grams: 25 }, { foodId: "milk", grams: 400 }, { foodId: "salt", grams: 8 }],
    waterG: 700, yield: { kind: "fndds", foodCode: 75649110 },
  },
  {
    id: "bean_soup", name: "Kuru fasulye çorbası", category: "dish", aliases: ["fasulye çorbası"], typicalPortionG: 250, portions: [{ unit: "kase", grams: 250 }],
    ingredients: [{ foodId: "white_beans_boiled", grams: 500 }, { foodId: "onion", grams: 100 }, { foodId: "carrot", grams: 80 }, { foodId: "tomato_paste", grams: 25 }, { foodId: "oil", grams: 30 }, { foodId: "salt", grams: 8 }],
    waterG: 900, yield: { kind: "fndds", foodCode: 41601010 },
  },
];
