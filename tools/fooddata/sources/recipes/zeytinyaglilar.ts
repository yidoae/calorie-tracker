// Zeytinyağlılar: raw vegetables cooked in olive oil; the FNDDS moisture change of the closest cooked
// vegetable (or stuffed vegetable) gives the cooked weight.
export default [
  {
    id: "green_beans_olive", name: "Zeytinyağlı taze fasulye", category: "dish", aliases: ["zeytinyağlı taze fasulye","zeytinyağlı fasulye"], typicalPortionG: 200, portions: [{ unit: "porsiyon", grams: 200 }],
    ingredients: [{ foodId: "green_beans", grams: 800 }, { foodId: "onion", grams: 150 }, { foodId: "tomato", grams: 300 }, { foodId: "oil", grams: 80 }, { foodId: "sugar", grams: 10 }, { foodId: "salt", grams: 8 }],
    waterG: 200, yield: { kind: "fndds", foodCode: 75205021 },
  },
  {
    id: "barbunya_olive", name: "Zeytinyağlı barbunya", category: "dish", aliases: ["zeytinyağlı barbunya","barbunya pilaki"], typicalPortionG: 200, portions: [{ unit: "porsiyon", grams: 200 }],
    ingredients: [{ foodId: "pinto_beans_dry", grams: 250 }, { foodId: "onion", grams: 120 }, { foodId: "carrot", grams: 100 }, { foodId: "tomato", grams: 200 }, { foodId: "oil", grams: 80 }, { foodId: "garlic", grams: 10 }, { foodId: "salt", grams: 8 }],
    waterG: 900, yield: { kind: "fndds", foodCode: 41601010 },
  },
  {
    id: "imam_bayildi", name: "İmam bayıldı", category: "dish", aliases: ["imam bayıldı"], typicalPortionG: 250, portions: [{ unit: "adet", grams: 220 }],
    ingredients: [{ foodId: "eggplant", grams: 1000 }, { foodId: "onion", grams: 300 }, { foodId: "tomato", grams: 300 }, { foodId: "garlic", grams: 20 }, { foodId: "oil", grams: 150 }, { foodId: "parsley", grams: 20 }, { foodId: "sugar", grams: 10 }, { foodId: "salt", grams: 10 }],
    yield: { kind: "fndds", foodCode: 75217020 },
  },
  {
    id: "artichoke_olive", name: "Zeytinyağlı enginar", category: "dish", aliases: ["zeytinyağlı enginar","enginar yemeği"], typicalPortionG: 200, portions: [{ unit: "adet", grams: 180 }],
    ingredients: [{ foodId: "artichoke", grams: 720 }, { foodId: "potato_raw", grams: 200 }, { foodId: "carrot", grams: 150 }, { foodId: "peas_frozen", grams: 100 }, { foodId: "onion", grams: 100 }, { foodId: "oil", grams: 80 }, { foodId: "lemon_juice", grams: 40 }, { foodId: "dill", grams: 20 }, { foodId: "sugar", grams: 10 }, { foodId: "salt", grams: 8 }],
    waterG: 300, yield: { kind: "fndds", foodCode: 75100750 },
  },
  {
    id: "leek_olive", name: "Zeytinyağlı pırasa", category: "dish", aliases: ["zeytinyağlı pırasa","pırasa yemeği"], typicalPortionG: 200, portions: [{ unit: "porsiyon", grams: 200 }],
    ingredients: [{ foodId: "leek", grams: 800 }, { foodId: "carrot", grams: 150 }, { foodId: "rice_raw", grams: 40 }, { foodId: "oil", grams: 70 }, { foodId: "lemon_juice", grams: 20 }, { foodId: "sugar", grams: 10 }, { foodId: "salt", grams: 8 }],
    waterG: 250, yield: { kind: "fndds", foodCode: 75218400 },
  },
  {
    id: "sarma_olive", name: "Zeytinyağlı yaprak sarma", category: "dish", aliases: ["yaprak sarma","sarma","zeytinyağlı sarma","yaprak dolması"], typicalPortionG: 150, portions: [{ unit: "adet", grams: 20 }],
    ingredients: [{ foodId: "grape_leaves", grams: 250 }, { foodId: "rice_raw", grams: 300 }, { foodId: "onion", grams: 300 }, { foodId: "oil", grams: 120 }, { foodId: "pine_nuts", grams: 20 }, { foodId: "raisins", grams: 20 }, { foodId: "mint", grams: 10 }, { foodId: "parsley", grams: 30 }, { foodId: "lemon_juice", grams: 40 }, { foodId: "sugar", grams: 10 }, { foodId: "salt", grams: 10 }],
    waterG: 500, yield: { kind: "fndds", foodCode: 58161510 },
  },
  {
    id: "pepper_dolma_olive", name: "Zeytinyağlı biber dolması", category: "dish", aliases: ["zeytinyağlı biber dolması","biber dolması"], typicalPortionG: 200, portions: [{ unit: "adet", grams: 100 }],
    ingredients: [{ foodId: "green_pepper", grams: 600 }, { foodId: "rice_raw", grams: 250 }, { foodId: "onion", grams: 250 }, { foodId: "oil", grams: 100 }, { foodId: "pine_nuts", grams: 15 }, { foodId: "raisins", grams: 15 }, { foodId: "tomato", grams: 150 }, { foodId: "mint", grams: 10 }, { foodId: "salt", grams: 8 }],
    waterG: 400, yield: { kind: "fndds", foodCode: 58162120 },
  },
  {
    id: "zucchini_olive", name: "Zeytinyağlı kabak", category: "dish", aliases: ["kabak yemeği","zeytinyağlı kabak"], typicalPortionG: 200, portions: [{ unit: "porsiyon", grams: 200 }],
    ingredients: [{ foodId: "zucchini", grams: 800 }, { foodId: "onion", grams: 150 }, { foodId: "tomato", grams: 200 }, { foodId: "rice_raw", grams: 40 }, { foodId: "oil", grams: 60 }, { foodId: "dill", grams: 20 }, { foodId: "salt", grams: 8 }],
    waterG: 100, yield: { kind: "fndds", foodCode: 75211031 },
  },
  {
    id: "peas_olive", name: "Zeytinyağlı bezelye", category: "dish", aliases: ["bezelye yemeği","zeytinyağlı bezelye"], typicalPortionG: 200, portions: [{ unit: "porsiyon", grams: 200 }],
    ingredients: [{ foodId: "peas_frozen", grams: 700 }, { foodId: "potato_raw", grams: 200 }, { foodId: "carrot", grams: 150 }, { foodId: "onion", grams: 100 }, { foodId: "oil", grams: 70 }, { foodId: "dill", grams: 15 }, { foodId: "salt", grams: 8 }],
    waterG: 300, yield: { kind: "fndds", foodCode: 75224000 },
  },
  {
    id: "celeriac_olive", name: "Zeytinyağlı kereviz", category: "dish", aliases: ["zeytinyağlı kereviz","kereviz yemeği"], typicalPortionG: 200, portions: [{ unit: "porsiyon", grams: 200 }],
    ingredients: [{ foodId: "celeriac", grams: 800 }, { foodId: "carrot", grams: 150 }, { foodId: "potato_raw", grams: 150 }, { foodId: "onion", grams: 100 }, { foodId: "oil", grams: 70 }, { foodId: "lemon_juice", grams: 40 }, { foodId: "orange_juice", grams: 100 }, { foodId: "sugar", grams: 10 }, { foodId: "salt", grams: 8 }],
    waterG: 200, yield: { kind: "fndds", foodCode: 75215020 },
  },
  {
    id: "okra_olive", name: "Zeytinyağlı bamya", category: "dish", aliases: ["bamya yemeği","zeytinyağlı bamya"], typicalPortionG: 200, portions: [{ unit: "porsiyon", grams: 200 }],
    ingredients: [{ foodId: "okra", grams: 700 }, { foodId: "onion", grams: 150 }, { foodId: "tomato", grams: 300 }, { foodId: "oil", grams: 70 }, { foodId: "lemon_juice", grams: 30 }, { foodId: "salt", grams: 8 }],
    waterG: 200, yield: { kind: "fndds", foodCode: 75220011 },
  },
  {
    id: "spinach_olive", name: "Zeytinyağlı ıspanak", category: "dish", aliases: ["ıspanak yemeği","zeytinyağlı ıspanak"], typicalPortionG: 200, portions: [{ unit: "porsiyon", grams: 200 }],
    ingredients: [{ foodId: "spinach_raw", grams: 1000 }, { foodId: "onion", grams: 150 }, { foodId: "rice_raw", grams: 50 }, { foodId: "tomato_paste", grams: 20 }, { foodId: "oil", grams: 60 }, { foodId: "salt", grams: 8 }],
    waterG: 150, yield: { kind: "fndds", foodCode: 72125221 },
  },
  {
    id: "cabbage_sarma_olive", name: "Zeytinyağlı lahana sarması", category: "dish", aliases: ["lahana sarması","lahana dolması"], typicalPortionG: 200, portions: [{ unit: "adet", grams: 40 }],
    ingredients: [{ foodId: "cabbage", grams: 800 }, { foodId: "rice_raw", grams: 250 }, { foodId: "onion", grams: 200 }, { foodId: "oil", grams: 100 }, { foodId: "tomato_paste", grams: 20 }, { foodId: "mint", grams: 10 }, { foodId: "salt", grams: 10 }],
    waterG: 500, yield: { kind: "fndds", foodCode: 58161510 },
  },
];
