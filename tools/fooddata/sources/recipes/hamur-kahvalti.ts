// Hamur işleri ve kahvaltılıklar. Börekler use FNDDS spanakopita (−10 %), breads FNDDS home-baked
// white bread (−8 %); egg dishes FNDDS omelet or scrambled egg made with oil (0 %).
export default [
  {
    id: "borek", name: "Peynirli tepsi böreği", category: "dish", aliases: ["börek","peynirli börek","tepsi böreği"], typicalPortionG: 150, portions: [{ unit: "dilim", grams: 100 }],
    ingredients: [{ foodId: "phyllo", grams: 500 }, { foodId: "white_cheese", grams: 300 }, { foodId: "milk", grams: 250 }, { foodId: "egg", grams: 150 }, { foodId: "oil", grams: 100 }, { foodId: "parsley", grams: 30 }],
    yield: { kind: "fndds", foodCode: 58124250 },
  },
  {
    id: "su_boregi", name: "Su böreği", category: "dish", aliases: ["su böreği"], typicalPortionG: 150, portions: [{ unit: "dilim", grams: 120 }],
    ingredients: [{ foodId: "flour", grams: 500 }, { foodId: "egg", grams: 250 }, { foodId: "white_cheese", grams: 350 }, { foodId: "butter", grams: 150 }, { foodId: "parsley", grams: 30 }, { foodId: "salt", grams: 6 }],
    waterG: 250, yield: { kind: "fndds", foodCode: 58124250 },
  },
  {
    id: "sigara_boregi", name: "Sigara böreği", category: "dish", aliases: ["sigara böreği","rulo börek"], typicalPortionG: 120, portions: [{ unit: "adet", grams: 30 }],
    ingredients: [{ foodId: "phyllo", grams: 400 }, { foodId: "white_cheese", grams: 300 }, { foodId: "parsley", grams: 30 }, { foodId: "sunflower_oil", grams: 150 }],
    yield: { kind: "fndds", foodCode: 58124250 },
  },
  {
    id: "spinach_borek", name: "Ispanaklı börek", category: "dish", aliases: ["ıspanaklı börek"], typicalPortionG: 150, portions: [{ unit: "dilim", grams: 100 }],
    ingredients: [{ foodId: "phyllo", grams: 500 }, { foodId: "spinach_raw", grams: 500 }, { foodId: "onion", grams: 100 }, { foodId: "white_cheese", grams: 150 }, { foodId: "milk", grams: 200 }, { foodId: "egg", grams: 100 }, { foodId: "oil", grams: 100 }, { foodId: "salt", grams: 6 }],
    yield: { kind: "fndds", foodCode: 58124250 },
  },
  {
    id: "minced_borek", name: "Kıymalı börek", category: "dish", aliases: ["kıymalı börek"], typicalPortionG: 150, portions: [{ unit: "dilim", grams: 100 }],
    ingredients: [{ foodId: "phyllo", grams: 500 }, { foodId: "beef_mince_cooked", grams: 300 }, { foodId: "onion", grams: 150 }, { foodId: "milk", grams: 200 }, { foodId: "egg", grams: 100 }, { foodId: "oil", grams: 100 }, { foodId: "salt", grams: 6 }],
    yield: { kind: "fndds", foodCode: 58124250 },
  },
  {
    id: "gozleme", name: "Peynirli gözleme", category: "dish", aliases: ["gözleme","peynirli gözleme"], typicalPortionG: 200, portions: [{ unit: "adet", grams: 200 }],
    ingredients: [{ foodId: "flour", grams: 500 }, { foodId: "white_cheese", grams: 300 }, { foodId: "parsley", grams: 30 }, { foodId: "butter", grams: 60 }, { foodId: "salt", grams: 6 }],
    waterG: 280, yield: { kind: "fndds", foodCode: 51101050 },
  },
  {
    id: "potato_gozleme", name: "Patatesli gözleme", category: "dish", aliases: ["patatesli gözleme"], typicalPortionG: 200, portions: [{ unit: "adet", grams: 200 }],
    ingredients: [{ foodId: "flour", grams: 500 }, { foodId: "potato", grams: 500 }, { foodId: "onion", grams: 100 }, { foodId: "paprika", grams: 5 }, { foodId: "butter", grams: 60 }, { foodId: "salt", grams: 8 }],
    waterG: 280, yield: { kind: "fndds", foodCode: 51101050 },
  },
  {
    id: "pogaca", name: "Peynirli poğaça", category: "dish", aliases: ["poğaça","peynirli poğaça"], typicalPortionG: 70, portions: [{ unit: "adet", grams: 70 }],
    ingredients: [{ foodId: "flour", grams: 500 }, { foodId: "yogurt", grams: 150 }, { foodId: "oil", grams: 120 }, { foodId: "butter", grams: 50 }, { foodId: "egg", grams: 50 }, { foodId: "white_cheese", grams: 200 }, { foodId: "baking_powder", grams: 10 }, { foodId: "salt", grams: 8 }],
    yield: { kind: "fndds", foodCode: 51101050 },
  },
  {
    id: "pisi", name: "Pişi", category: "dish", aliases: ["pişi","hamur kızartması","halka pişi"], typicalPortionG: 80, portions: [{ unit: "adet", grams: 40 }],
    ingredients: [{ foodId: "flour", grams: 500 }, { foodId: "yeast", grams: 10 }, { foodId: "sunflower_oil", grams: 150 }, { foodId: "salt", grams: 8 }],
    waterG: 300, yield: { kind: "fndds", foodCode: 53415110 },
  },
  {
    id: "menemen", name: "Menemen", category: "dish", aliases: ["menemen"], typicalPortionG: 250,
    ingredients: [{ foodId: "egg", grams: 300 }, { foodId: "tomato", grams: 500 }, { foodId: "green_pepper", grams: 150 }, { foodId: "onion", grams: 80 }, { foodId: "oil", grams: 40 }, { foodId: "salt", grams: 5 }],
    yield: { kind: "fndds", foodCode: 32130010 },
  },
  {
    id: "sucuklu_yumurta", name: "Sucuklu yumurta", category: "dish", aliases: ["sucuklu yumurta"], typicalPortionG: 200, portions: [{ unit: "porsiyon", grams: 200 }],
    ingredients: [{ foodId: "egg", grams: 150 }, { foodId: "sucuk", grams: 60 }, { foodId: "butter", grams: 10 }],
    yield: { kind: "fndds", foodCode: 32130010 },
  },
  {
    id: "cilbir", name: "Çılbır", category: "dish", aliases: ["çılbır"], typicalPortionG: 250, portions: [{ unit: "porsiyon", grams: 250 }],
    ingredients: [{ foodId: "egg_poached", grams: 100 }, { foodId: "yogurt", grams: 150 }, { foodId: "garlic", grams: 5 }, { foodId: "butter", grams: 20 }, { foodId: "paprika", grams: 2 }],
    yield: { kind: "fndds", foodCode: 31103010 },
  },
  {
    id: "potato_omelet", name: "Patatesli omlet", category: "dish", aliases: ["patatesli omlet","patatesli yumurta"], typicalPortionG: 200, portions: [{ unit: "porsiyon", grams: 200 }],
    ingredients: [{ foodId: "egg", grams: 200 }, { foodId: "potato", grams: 150 }, { foodId: "onion", grams: 40 }, { foodId: "oil", grams: 20 }, { foodId: "salt", grams: 3 }],
    yield: { kind: "fndds", foodCode: 32130010 },
  },
  {
    id: "tost", name: "Kaşarlı tost", category: "dish", aliases: ["karışık tost","kaşarlı tost","tost"], typicalPortionG: 130, portions: [{ unit: "adet", grams: 130 }],
    ingredients: [{ foodId: "toast_bread", grams: 70 }, { foodId: "kasar_cheese", grams: 40 }, { foodId: "butter", grams: 8 }, { foodId: "tomato", grams: 12 }],
    yield: { kind: "fndds", foodCode: 14640000 },
  },
  {
    id: "simit", name: "Simit", category: "bread", aliases: ["simit"], typicalPortionG: 120, portions: [{ unit: "adet", grams: 120 }],
    ingredients: [{ foodId: "flour", grams: 500 }, { foodId: "yeast", grams: 10 }, { foodId: "molasses", grams: 80 }, { foodId: "sesame", grams: 80 }, { foodId: "oil", grams: 15 }, { foodId: "salt", grams: 10 }],
    waterG: 280, yield: { kind: "fndds", foodCode: 51101050 },
  },
  {
    id: "white_bread", name: "Beyaz ekmek", category: "bread", aliases: ["beyaz ekmek","bread","ekmek","somun ekmek"], typicalPortionG: 50, portions: [{ unit: "dilim", grams: 30 }],
    ingredients: [{ foodId: "flour", grams: 1000 }, { foodId: "yeast", grams: 20 }, { foodId: "salt", grams: 18 }],
    waterG: 620, yield: { kind: "fndds", foodCode: 51101050 },
  },
];
