// Sokak lezzetleri ve fırın. Sandwiches keep their weight (FNDDS sandwich codes, 0 %); breads use
// FNDDS home-baked white bread (−8 %); fried dough FNDDS plain fritter (−30 %).
export default [
  {
    id: "acma", name: "Açma", category: "bread", aliases: ["açma","sade açma"], typicalPortionG: 90, portions: [{ unit: "adet", grams: 90 }],
    ingredients: [{ foodId: "flour", grams: 500 }, { foodId: "milk", grams: 200 }, { foodId: "butter", grams: 80 }, { foodId: "sunflower_oil", grams: 40 }, { foodId: "sugar", grams: 30 }, { foodId: "egg", grams: 50 }, { foodId: "yeast", grams: 20 }, { foodId: "salt", grams: 8 }],
    waterG: 80, yield: { kind: "fndds", foodCode: 51101050 },
  },
  {
    id: "ramazan_pidesi", name: "Ramazan pidesi", category: "bread", aliases: ["ramazan pidesi","pide ekmek","pide ekmeği"], typicalPortionG: 80, portions: [{ unit: "dilim", grams: 40 }, { unit: "adet", grams: 350 }],
    ingredients: [{ foodId: "flour", grams: 500 }, { foodId: "yeast", grams: 15 }, { foodId: "sunflower_oil", grams: 15 }, { foodId: "egg_yolk", grams: 17 }, { foodId: "sesame", grams: 8 }, { foodId: "salt", grams: 9 }],
    waterG: 330, yield: { kind: "fndds", foodCode: 51101050 },
  },
  {
    id: "bazlama", name: "Bazlama", category: "bread", aliases: ["bazlama"], typicalPortionG: 100, portions: [{ unit: "adet", grams: 200 }],
    ingredients: [{ foodId: "flour", grams: 500 }, { foodId: "yogurt", grams: 100 }, { foodId: "yeast", grams: 15 }, { foodId: "sunflower_oil", grams: 15 }, { foodId: "sugar", grams: 5 }, { foodId: "salt", grams: 9 }],
    waterG: 220, yield: { kind: "fndds", foodCode: 51101050 },
  },
  {
    id: "corn_bread", name: "Mısır ekmeği", category: "bread", aliases: ["mısır ekmeği","karadeniz mısır ekmeği"], typicalPortionG: 80, portions: [{ unit: "dilim", grams: 80 }],
    ingredients: [{ foodId: "cornmeal", grams: 400 }, { foodId: "flour", grams: 100 }, { foodId: "yogurt", grams: 200 }, { foodId: "egg", grams: 100 }, { foodId: "sunflower_oil", grams: 60 }, { foodId: "baking_powder", grams: 10 }, { foodId: "salt", grams: 8 }],
    waterG: 250, yield: { kind: "fndds", foodCode: 51101050 },
  },
  {
    id: "kumru", name: "Kumru", category: "dish", aliases: ["kumru","izmir kumrusu"], typicalPortionG: 230, portions: [{ unit: "adet", grams: 230 }],
    ingredients: [{ foodId: "bun", grams: 110 }, { foodId: "sucuk", grams: 30 }, { foodId: "salami", grams: 20 }, { foodId: "kasar_cheese", grams: 40 }, { foodId: "tomato", grams: 30 }],
    yield: { kind: "fndds", foodCode: 14640000 },
  },
  {
    id: "islak_hamburger", name: "Islak hamburger", category: "dish", aliases: ["ıslak hamburger","ıslak burger"], typicalPortionG: 150, portions: [{ unit: "adet", grams: 150 }],
    ingredients: [{ foodId: "bun", grams: 70 }, { foodId: "beef_patty", grams: 45 }, { foodId: "marinara", grams: 25 }, { foodId: "butter", grams: 8 }, { foodId: "garlic", grams: 2 }],
    yield: { kind: "fndds", foodCode: 27510521 },
  },
  {
    id: "balik_ekmek", name: "Balık ekmek", category: "dish", aliases: ["balık ekmek","uskumru ekmek"], typicalPortionG: 300, portions: [{ unit: "adet", grams: 300 }],
    ingredients: [{ foodId: "french_bread", grams: 150 }, { foodId: "mackerel_cooked", grams: 100 }, { foodId: "onion", grams: 30 }, { foodId: "lettuce_romaine", grams: 15 }, { foodId: "tomato", grams: 30 }, { foodId: "lemon_juice", grams: 5 }],
    yield: { kind: "fndds", foodCode: 27550420 },
  },
  {
    id: "kofte_ekmek", name: "Köfte ekmek", category: "dish", aliases: ["köfte ekmek","ekmek arası köfte"], typicalPortionG: 300, portions: [{ unit: "adet", grams: 300 }],
    ingredients: [{ foodId: "french_bread", grams: 150 }, { foodId: "beef_mince_cooked", grams: 100 }, { foodId: "tomato", grams: 30 }, { foodId: "onion", grams: 20 }, { foodId: "green_pepper", grams: 15 }, { foodId: "parsley", grams: 5 }],
    yield: { kind: "fndds", foodCode: 27500050 },
  },
  {
    id: "sosisli", name: "Sosisli sandviç", category: "dish", aliases: ["sosisli","sosisli sandviç","hot dog"], typicalPortionG: 150, portions: [{ unit: "adet", grams: 150 }],
    ingredients: [{ foodId: "bun", grams: 80 }, { foodId: "frankfurter", grams: 50 }, { foodId: "ketchup", grams: 10 }, { foodId: "mustard", grams: 5 }, { foodId: "pickles", grams: 10 }],
    yield: { kind: "fndds", foodCode: 27564000 },
  },
  {
    id: "kumpir", name: "Kumpir", category: "dish", aliases: ["kumpir"], typicalPortionG: 500, portions: [{ unit: "adet", grams: 500 }],
    ingredients: [{ foodId: "potato_raw", grams: 350 }, { foodId: "butter", grams: 20 }, { foodId: "kasar_cheese", grams: 60 }, { foodId: "corn_canned", grams: 30 }, { foodId: "pickles", grams: 25 }, { foodId: "olives", grams: 15 }, { foodId: "salami", grams: 20 }, { foodId: "ketchup", grams: 10 }, { foodId: "mayonnaise", grams: 10 }],
    yield: { kind: "fndds", foodCode: 71508020 },
  },
  {
    // Mussel meat with the spiced rice; the shell is not counted (one stuffed mussel ≈ 15 g edible).
    id: "midye_dolma", name: "Midye dolma", category: "dish", aliases: ["midye dolma","midye dolması"], typicalPortionG: 150, portions: [{ unit: "adet", grams: 15 }],
    ingredients: [{ foodId: "mussel_raw", grams: 300 }, { foodId: "rice_raw", grams: 200 }, { foodId: "onion", grams: 150 }, { foodId: "oil", grams: 60 }, { foodId: "pine_nuts", grams: 15 }, { foodId: "raisins", grams: 15 }, { foodId: "tomato_paste", grams: 15 }, { foodId: "salt", grams: 6 }],
    waterG: 300, yield: { kind: "fndds", foodCode: 58161510 },
  },
  {
    id: "etli_ekmek", name: "Etli ekmek", category: "dish", aliases: ["etli ekmek","konya etli ekmek"], typicalPortionG: 250, portions: [{ unit: "dilim", grams: 80 }, { unit: "adet", grams: 400 }],
    ingredients: [{ foodId: "flour", grams: 500 }, { foodId: "yeast", grams: 10 }, { foodId: "beef_mince_raw", grams: 400 }, { foodId: "onion", grams: 150 }, { foodId: "tomato", grams: 200 }, { foodId: "green_pepper", grams: 100 }, { foodId: "salt", grams: 12 }],
    waterG: 280, yield: { kind: "fndds", foodCode: 51101050 },
  },
  {
    id: "tulumba", name: "Tulumba tatlısı", category: "sweet", aliases: ["tulumba","tulumba tatlısı"], typicalPortionG: 100, portions: [{ unit: "adet", grams: 20 }],
    ingredients: [{ foodId: "flour", grams: 250 }, { foodId: "butter", grams: 30 }, { foodId: "egg", grams: 100 }, { foodId: "sunflower_oil", grams: 120 }, { foodId: "sugar", grams: 600 }, { foodId: "lemon_juice", grams: 10 }],
    waterG: 800, yield: { kind: "fndds", foodCode: 53415110 },
  },
];
