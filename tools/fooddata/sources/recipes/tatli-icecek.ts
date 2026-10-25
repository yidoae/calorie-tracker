// Tatlılar ve sıcak içecekler (admin batch 1). Syrup desserts use FNDDS baklava (−11 %), milk
// puddings FNDDS pudding (0 %), milk drinks FNDDS hot cocoa with milk (0 %).
export default [
  {
    // Tel kadayıf is plain flour-and-water dough like yufka; SR phyllo stands in for it.
    id: "kunefe", name: "Künefe", category: "sweet", aliases: ["künefe","hatay künefesi"], typicalPortionG: 150, portions: [{ unit: "porsiyon", grams: 150 }],
    ingredients: [{ foodId: "phyllo", grams: 250 }, { foodId: "butter", grams: 120 }, { foodId: "mozzarella", grams: 200 }, { foodId: "sugar", grams: 300 }, { foodId: "lemon_juice", grams: 5 }],
    waterG: 250, yield: { kind: "fndds", foodCode: 53441110 },
  },
  {
    id: "tel_kadayif", name: "Kadayıf (cevizli)", category: "sweet", aliases: ["kadayıf","tel kadayıf","cevizli kadayıf"], typicalPortionG: 100, portions: [{ unit: "dilim", grams: 80 }],
    ingredients: [{ foodId: "phyllo", grams: 500 }, { foodId: "butter", grams: 200 }, { foodId: "walnuts", grams: 200 }, { foodId: "sugar", grams: 700 }, { foodId: "lemon_juice", grams: 10 }],
    waterG: 600, yield: { kind: "fndds", foodCode: 53441110 },
  },
  {
    id: "sekerpare", name: "Şekerpare", category: "sweet", aliases: ["şekerpare"], typicalPortionG: 80, portions: [{ unit: "adet", grams: 40 }],
    ingredients: [{ foodId: "flour", grams: 300 }, { foodId: "semolina", grams: 30 }, { foodId: "butter", grams: 125 }, { foodId: "powdered_sugar", grams: 60 }, { foodId: "egg", grams: 50 }, { foodId: "baking_powder", grams: 5 }, { foodId: "sugar", grams: 500 }, { foodId: "lemon_juice", grams: 10 }],
    waterG: 500, yield: { kind: "fndds", foodCode: 53441110 },
  },
  {
    id: "kazandibi", name: "Kazandibi", category: "sweet", aliases: ["kazandibi"], typicalPortionG: 150, portions: [{ unit: "dilim", grams: 120 }],
    ingredients: [{ foodId: "milk", grams: 1000 }, { foodId: "sugar", grams: 180 }, { foodId: "cornstarch", grams: 40 }, { foodId: "flour", grams: 40 }, { foodId: "butter", grams: 10 }, { foodId: "powdered_sugar", grams: 10 }],
    yield: { kind: "fndds", foodCode: 13210280 },
  },
  {
    id: "tavuk_gogsu_tatli", name: "Tavuk göğsü (tatlı)", category: "sweet", aliases: ["tavuk göğsü tatlısı","tavukgöğsü"], typicalPortionG: 150, portions: [{ unit: "dilim", grams: 120 }],
    ingredients: [{ foodId: "milk", grams: 1000 }, { foodId: "chicken_breast_raw", grams: 60 }, { foodId: "sugar", grams: 180 }, { foodId: "cornstarch", grams: 50 }, { foodId: "flour", grams: 30 }],
    yield: { kind: "fndds", foodCode: 13210280 },
  },
  {
    id: "supangle", name: "Supangle", category: "sweet", aliases: ["supangle","sübye"], typicalPortionG: 150, portions: [{ unit: "kase", grams: 150 }],
    ingredients: [{ foodId: "milk", grams: 1000 }, { foodId: "sugar", grams: 150 }, { foodId: "cocoa_powder", grams: 40 }, { foodId: "flour", grams: 40 }, { foodId: "cornstarch", grams: 20 }, { foodId: "butter", grams: 30 }, { foodId: "dark_chocolate", grams: 50 }],
    yield: { kind: "fndds", foodCode: 13200110 },
  },
  {
    id: "keskul", name: "Keşkül", category: "sweet", aliases: ["keşkül","bademli muhallebi"], typicalPortionG: 150, portions: [{ unit: "kase", grams: 150 }],
    ingredients: [{ foodId: "milk", grams: 1000 }, { foodId: "sugar", grams: 150 }, { foodId: "almonds", grams: 100 }, { foodId: "cornstarch", grams: 40 }, { foodId: "egg_yolk", grams: 20 }],
    yield: { kind: "fndds", foodCode: 13210280 },
  },
  {
    // Buğday (dövme) is replaced by pearled barley, the closest SR grain; the water is what stays in the pot.
    id: "asure", name: "Aşure", category: "sweet", aliases: ["aşure"], typicalPortionG: 200, portions: [{ unit: "kase", grams: 200 }],
    ingredients: [{ foodId: "barley", grams: 200 }, { foodId: "chickpeas_boiled", grams: 150 }, { foodId: "white_beans_boiled", grams: 150 }, { foodId: "sugar", grams: 400 }, { foodId: "apricot_dried", grams: 100 }, { foodId: "fig_dried", grams: 100 }, { foodId: "raisins", grams: 80 }, { foodId: "walnuts", grams: 50 }, { foodId: "hazelnuts", grams: 30 }],
    waterG: 1500, yield: { kind: "fndds", foodCode: 13210410 },
  },
  {
    // Salep powder is orchid-root starch; commercial mixes are starch and sugar, so corn starch stands in.
    id: "salep", name: "Salep", category: "drink", aliases: ["salep","sahlep"], typicalPortionG: 250, portions: [{ unit: "kupa", grams: 250 }],
    ingredients: [{ foodId: "milk", grams: 1000 }, { foodId: "sugar", grams: 70 }, { foodId: "cornstarch", grams: 25 }, { foodId: "cinnamon", grams: 2 }],
    yield: { kind: "fndds", foodCode: 11512010 },
  },
  {
    id: "hot_chocolate", name: "Sıcak çikolata", category: "drink", aliases: ["sıcak çikolata","sıcak kakao"], typicalPortionG: 250, portions: [{ unit: "kupa", grams: 250 }],
    ingredients: [{ foodId: "milk", grams: 1000 }, { foodId: "cocoa_powder", grams: 30 }, { foodId: "sugar", grams: 60 }, { foodId: "dark_chocolate", grams: 40 }],
    yield: { kind: "fndds", foodCode: 11512010 },
  },
  {
    id: "latte", name: "Latte", category: "drink", aliases: ["latte","sütlü kahve","caffe latte","cappuccino"], typicalPortionG: 300, portions: [{ unit: "kupa", grams: 300 }],
    ingredients: [{ foodId: "turkish_coffee", grams: 60 }, { foodId: "milk", grams: 240 }],
    yield: { kind: "fndds", foodCode: 11512010 },
  },
  {
    id: "turkish_coffee_sweet", name: "Türk kahvesi (orta şekerli)", category: "drink", aliases: ["orta şekerli türk kahvesi","şekerli türk kahvesi","orta kahve"], typicalPortionG: 70, portions: [{ unit: "fincan", grams: 70 }],
    ingredients: [{ foodId: "turkish_coffee", grams: 65 }, { foodId: "sugar", grams: 5 }],
    yield: { kind: "fndds", foodCode: 92101600 },
  },
];
