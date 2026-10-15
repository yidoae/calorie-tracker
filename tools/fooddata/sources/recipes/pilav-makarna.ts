// Pilavlar ve makarnalar. FNDDS rice, bulgur and pasta dishes are built from the cooked grain with a
// 0 % moisture change, so these recipes start from the USDA cooked grain too (research §2).
export default [
  {
    id: "white_rice", name: "Pirinç pilavı (pişmiş)", category: "dish", aliases: ["pilav","pirinç pilavı","tereyağlı pilav","white rice"], typicalPortionG: 150, portions: [{ unit: "yemek kaşığı", grams: 15 }, { unit: "kase", grams: 150 }],
    ingredients: [{ foodId: "rice_boiled", grams: 900 }, { foodId: "butter", grams: 40 }, { foodId: "oil", grams: 15 }, { foodId: "salt", grams: 8 }],
    yield: { kind: "fndds", foodCode: 56205004 },
  },
  {
    id: "bulgur", name: "Bulgur pilavı (pişmiş)", category: "dish", aliases: ["bulgur pilavı"], typicalPortionG: 150, portions: [{ unit: "yemek kaşığı", grams: 15 }, { unit: "kase", grams: 150 }],
    ingredients: [{ foodId: "bulgur_cooked", grams: 900 }, { foodId: "onion", grams: 80 }, { foodId: "green_pepper", grams: 50 }, { foodId: "tomato_paste", grams: 25 }, { foodId: "butter", grams: 30 }, { foodId: "oil", grams: 15 }, { foodId: "salt", grams: 8 }],
    yield: { kind: "fndds", foodCode: 56207120 },
  },
  {
    id: "vermicelli_rice", name: "Şehriyeli pilav", category: "dish", aliases: ["şehriyeli pilav","şehriyeli pirinç pilavı"], typicalPortionG: 150, portions: [{ unit: "kase", grams: 150 }],
    ingredients: [{ foodId: "rice_boiled", grams: 800 }, { foodId: "spaghetti", grams: 100 }, { foodId: "butter", grams: 40 }, { foodId: "salt", grams: 8 }],
    yield: { kind: "fndds", foodCode: 56205004 },
  },
  {
    id: "tomato_bulgur", name: "Domatesli bulgur pilavı", category: "dish", aliases: ["domatesli bulgur","domatesli bulgur pilavı"], typicalPortionG: 150, portions: [{ unit: "kase", grams: 150 }],
    ingredients: [{ foodId: "bulgur_cooked", grams: 800 }, { foodId: "tomato", grams: 200 }, { foodId: "tomato_paste", grams: 30 }, { foodId: "onion", grams: 80 }, { foodId: "oil", grams: 30 }, { foodId: "salt", grams: 8 }],
    yield: { kind: "fndds", foodCode: 56207120 },
  },
  {
    id: "ic_pilav", name: "İç pilav", category: "dish", aliases: ["iç pilav","fıstıklı pilav"], typicalPortionG: 150, portions: [{ unit: "kase", grams: 150 }],
    ingredients: [{ foodId: "rice_boiled", grams: 800 }, { foodId: "pine_nuts", grams: 30 }, { foodId: "raisins", grams: 30 }, { foodId: "onion", grams: 80 }, { foodId: "butter", grams: 40 }, { foodId: "salt", grams: 8 }],
    yield: { kind: "fndds", foodCode: 56205004 },
  },
  {
    id: "chickpea_rice", name: "Nohutlu pilav", category: "dish", aliases: ["nohutlu pilav","pilav üstü nohut"], typicalPortionG: 200, portions: [{ unit: "kase", grams: 200 }],
    ingredients: [{ foodId: "rice_boiled", grams: 800 }, { foodId: "chickpeas_boiled", grams: 200 }, { foodId: "butter", grams: 40 }, { foodId: "salt", grams: 8 }],
    yield: { kind: "fndds", foodCode: 56205004 },
  },
  {
    id: "chicken_rice", name: "Tavuklu pilav", category: "dish", aliases: ["tavuklu pilav","pilav üstü tavuk pilavı"], typicalPortionG: 250, portions: [{ unit: "porsiyon", grams: 250 }],
    ingredients: [{ foodId: "rice_boiled", grams: 700 }, { foodId: "chicken_boiled", grams: 250 }, { foodId: "butter", grams: 35 }, { foodId: "salt", grams: 8 }],
    yield: { kind: "fndds", foodCode: 56205004 },
  },
  {
    id: "pasta_tomato", name: "Salçalı makarna", category: "dish", aliases: ["salçalı makarna","domates soslu makarna"], typicalPortionG: 250, portions: [{ unit: "tabak", grams: 250 }],
    ingredients: [{ foodId: "spaghetti", grams: 800 }, { foodId: "tomato_paste", grams: 40 }, { foodId: "oil", grams: 30 }, { foodId: "garlic", grams: 10 }, { foodId: "salt", grams: 6 }],
    yield: { kind: "fndds", foodCode: 56130000 },
  },
  {
    id: "pasta_plain", name: "Tereyağlı makarna", category: "dish", aliases: ["tereyağlı makarna","sade makarna","peynirli makarna"], typicalPortionG: 250, portions: [{ unit: "tabak", grams: 250 }],
    ingredients: [{ foodId: "spaghetti", grams: 800 }, { foodId: "butter", grams: 40 }, { foodId: "white_cheese", grams: 60 }, { foodId: "salt", grams: 4 }],
    yield: { kind: "fndds", foodCode: 56130000 },
  },
  {
    id: "bolognese", name: "Kıymalı sos", category: "dish", aliases: ["bolonez sos","kıymalı sos"], typicalPortionG: 150,
    ingredients: [{ foodId: "beef_mince_cooked", grams: 300 }, { foodId: "onion", grams: 150 }, { foodId: "tomato_canned", grams: 400 }, { foodId: "tomato_paste", grams: 30 }, { foodId: "carrot", grams: 80 }, { foodId: "oil", grams: 20 }, { foodId: "garlic", grams: 10 }, { foodId: "salt", grams: 6 }],
    yield: { kind: "fndds", foodCode: 27162040 },
  },
  {
    id: "pasta_bolognese", name: "Kıymalı makarna", category: "dish", aliases: ["kıymalı makarna","bolonez makarna","spagetti bolonez"], typicalPortionG: 300, portions: [{ unit: "tabak", grams: 300 }],
    ingredients: [{ foodId: "spaghetti", grams: 600 }, { foodId: "beef_mince_cooked", grams: 150 }, { foodId: "tomato_canned", grams: 200 }, { foodId: "onion", grams: 60 }, { foodId: "oil", grams: 15 }, { foodId: "salt", grams: 6 }],
    yield: { kind: "fndds", foodCode: 56130000 },
  },
  {
    id: "baked_pasta", name: "Fırın makarna", category: "dish", aliases: ["fırın makarna","beşamel soslu makarna"], typicalPortionG: 250, portions: [{ unit: "dilim", grams: 200 }],
    ingredients: [{ foodId: "spaghetti", grams: 700 }, { foodId: "milk", grams: 400 }, { foodId: "egg", grams: 100 }, { foodId: "white_cheese", grams: 100 }, { foodId: "butter", grams: 30 }, { foodId: "flour", grams: 20 }, { foodId: "salt", grams: 6 }],
    yield: { kind: "fndds", foodCode: 58130011 },
  },
  {
    id: "manti", name: "Mantı (yoğurtlu)", category: "dish", aliases: ["mantı","yoğurtlu mantı","kayseri mantısı"], typicalPortionG: 250, portions: [{ unit: "tabak", grams: 250 }],
    ingredients: [{ foodId: "noodles_cooked", grams: 500 }, { foodId: "beef_mince_cooked", grams: 120 }, { foodId: "onion", grams: 40 }, { foodId: "yogurt", grams: 300 }, { foodId: "garlic", grams: 8 }, { foodId: "butter", grams: 30 }, { foodId: "paprika", grams: 3 }, { foodId: "salt", grams: 6 }],
    yield: { kind: "fndds", foodCode: 56130000 },
  },
];
