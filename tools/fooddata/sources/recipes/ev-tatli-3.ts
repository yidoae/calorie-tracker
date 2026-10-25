// Yöresel ve ev yemekleri, kahvaltılıklar, kafe tatlıları (admin batch 3). Grilled and fried meats
// start from cooked USDA meat, as in kebaplar.ts; each yield is the FNDDS code of the closest dish.
export default [
  {
    id: "cag_kebabi", name: "Cağ kebabı", category: "dish", aliases: ["cağ kebabı","cağ kebap","erzurum cağ kebabı"], typicalPortionG: 200, portions: [{ unit: "şiş", grams: 100 }],
    ingredients: [{ foodId: "lamb_leg_cooked", grams: 800 }, { foodId: "lamb_mince_cooked", grams: 100 }, { foodId: "onion", grams: 80 }, { foodId: "salt", grams: 10 }],
    yield: { kind: "fndds", foodCode: 27430610 },
  },
  {
    id: "arnavut_cigeri", name: "Arnavut ciğeri", category: "dish", aliases: ["arnavut ciğeri","ciğer kızartması"], typicalPortionG: 200, portions: [{ unit: "porsiyon", grams: 200 }],
    ingredients: [{ foodId: "beef_liver_cooked", grams: 500 }, { foodId: "flour", grams: 30 }, { foodId: "sunflower_oil", grams: 40 }, { foodId: "onion", grams: 150 }, { foodId: "parsley", grams: 20 }, { foodId: "paprika", grams: 3 }, { foodId: "salt", grams: 6 }],
    yield: { kind: "fndds", foodCode: 27460750 },
  },
  {
    id: "perde_pilavi", name: "Perde pilavı", category: "dish", aliases: ["perde pilavı","siirt perde pilavı"], typicalPortionG: 250, portions: [{ unit: "dilim", grams: 250 }],
    ingredients: [{ foodId: "flour", grams: 300 }, { foodId: "butter", grams: 130 }, { foodId: "yogurt", grams: 100 }, { foodId: "egg", grams: 50 }, { foodId: "chicken_breast_raw", grams: 300 }, { foodId: "rice_raw", grams: 400 }, { foodId: "almonds", grams: 50 }, { foodId: "salt", grams: 12 }],
    waterG: 700, yield: { kind: "fndds", foodCode: 56205004 },
  },
  {
    id: "fellah_koftesi", name: "Fellah köftesi", category: "dish", aliases: ["fellah köftesi","hatay fellah köftesi"], typicalPortionG: 250, portions: [{ unit: "porsiyon", grams: 250 }],
    ingredients: [{ foodId: "bulgur_dry", grams: 300 }, { foodId: "semolina", grams: 100 }, { foodId: "flour", grams: 50 }, { foodId: "tomato_paste", grams: 60 }, { foodId: "oil", grams: 80 }, { foodId: "garlic", grams: 20 }, { foodId: "lemon_juice", grams: 30 }, { foodId: "salt", grams: 10 }],
    waterG: 900, yield: { kind: "fndds", foodCode: 56207120 },
  },
  {
    id: "fasulye_pilaki", name: "Fasulye pilaki", category: "dish", aliases: ["fasulye pilaki","pilaki","zeytinyağlı kuru fasulye"], typicalPortionG: 200, portions: [{ unit: "porsiyon", grams: 200 }],
    ingredients: [{ foodId: "white_beans_boiled", grams: 600 }, { foodId: "carrot", grams: 100 }, { foodId: "potato_raw", grams: 150 }, { foodId: "onion", grams: 100 }, { foodId: "garlic", grams: 10 }, { foodId: "oil", grams: 80 }, { foodId: "tomato_paste", grams: 20 }, { foodId: "salt", grams: 8 }],
    waterG: 150, yield: { kind: "fndds", foodCode: 75649110 },
  },
  {
    id: "pirasali_borek", name: "Pırasalı börek", category: "dish", aliases: ["pırasalı börek"], typicalPortionG: 150, portions: [{ unit: "dilim", grams: 100 }],
    ingredients: [{ foodId: "phyllo", grams: 500 }, { foodId: "leek", grams: 400 }, { foodId: "white_cheese", grams: 150 }, { foodId: "milk", grams: 200 }, { foodId: "egg", grams: 100 }, { foodId: "oil", grams: 100 }, { foodId: "salt", grams: 6 }],
    yield: { kind: "fndds", foodCode: 58124250 },
  },
  {
    id: "kremali_tavuk_corbasi", name: "Kremalı tavuk çorbası", category: "dish", aliases: ["kremalı tavuk çorbası","terbiyeli tavuk çorbası"], typicalPortionG: 250, portions: [{ unit: "kase", grams: 250 }],
    ingredients: [{ foodId: "chicken_breast_raw", grams: 300 }, { foodId: "flour", grams: 50 }, { foodId: "butter", grams: 40 }, { foodId: "milk", grams: 300 }, { foodId: "egg_yolk", grams: 20 }, { foodId: "lemon_juice", grams: 20 }, { foodId: "salt", grams: 10 }],
    waterG: 1200, yield: { kind: "fndds", foodCode: 28340660 },
  },
  {
    id: "kaygana", name: "Kaygana", category: "dish", aliases: ["kaygana","karadeniz omleti"], typicalPortionG: 150, portions: [{ unit: "porsiyon", grams: 150 }],
    ingredients: [{ foodId: "egg", grams: 200 }, { foodId: "flour", grams: 40 }, { foodId: "milk", grams: 100 }, { foodId: "butter", grams: 20 }, { foodId: "salt", grams: 3 }],
    yield: { kind: "fndds", foodCode: 32130010 },
  },
  {
    id: "kiymali_yumurta", name: "Kıymalı yumurta", category: "dish", aliases: ["kıymalı yumurta"], typicalPortionG: 200, portions: [{ unit: "porsiyon", grams: 200 }],
    ingredients: [{ foodId: "beef_mince_raw", grams: 150 }, { foodId: "egg", grams: 150 }, { foodId: "onion", grams: 50 }, { foodId: "butter", grams: 10 }, { foodId: "salt", grams: 3 }],
    yield: { kind: "fndds", foodCode: 32130010 },
  },
  {
    id: "yumurtali_ekmek", name: "Yumurtalı ekmek", category: "dish", aliases: ["yumurtalı ekmek","yumurtaya bulanmış ekmek","french toast"], typicalPortionG: 120, portions: [{ unit: "dilim", grams: 50 }],
    ingredients: [{ foodId: "toast_bread", grams: 120 }, { foodId: "egg", grams: 100 }, { foodId: "milk", grams: 50 }, { foodId: "sunflower_oil", grams: 30 }, { foodId: "salt", grams: 2 }],
    yield: { kind: "fndds", foodCode: 55301000 },
  },
  {
    id: "pankek", name: "Pankek", category: "dish", aliases: ["pankek","pancake"], typicalPortionG: 120, portions: [{ unit: "adet", grams: 40 }],
    ingredients: [{ foodId: "flour", grams: 150 }, { foodId: "milk", grams: 250 }, { foodId: "egg", grams: 100 }, { foodId: "sugar", grams: 20 }, { foodId: "butter", grams: 20 }, { foodId: "baking_powder", grams: 8 }],
    yield: { kind: "fndds", foodCode: 55101000 },
  },
  {
    id: "waffle", name: "Waffle (sade)", category: "sweet", aliases: ["waffle","vafıl"], typicalPortionG: 100, portions: [{ unit: "adet", grams: 75 }],
    ingredients: [{ foodId: "flour", grams: 250 }, { foodId: "milk", grams: 300 }, { foodId: "egg", grams: 100 }, { foodId: "butter", grams: 60 }, { foodId: "sugar", grams: 30 }, { foodId: "baking_powder", grams: 10 }],
    yield: { kind: "fndds", foodCode: 55201000 },
  },
  {
    id: "islak_kek", name: "Islak kek", category: "sweet", aliases: ["ıslak kek","brownie kek"], typicalPortionG: 100, portions: [{ unit: "dilim", grams: 90 }],
    ingredients: [{ foodId: "flour", grams: 250 }, { foodId: "sugar", grams: 300 }, { foodId: "egg", grams: 150 }, { foodId: "milk", grams: 400 }, { foodId: "sunflower_oil", grams: 150 }, { foodId: "cocoa_powder", grams: 60 }, { foodId: "baking_powder", grams: 10 }],
    yield: { kind: "fndds", foodCode: 53105275 },
  },
  {
    id: "brownie", name: "Brownie", category: "sweet", aliases: ["brownie","browni"], typicalPortionG: 60, portions: [{ unit: "dilim", grams: 60 }],
    ingredients: [{ foodId: "semisweet_chocolate", grams: 150 }, { foodId: "butter", grams: 150 }, { foodId: "sugar", grams: 200 }, { foodId: "egg", grams: 150 }, { foodId: "flour", grams: 100 }, { foodId: "cocoa_powder", grams: 20 }],
    yield: { kind: "fndds", foodCode: 53204010 },
  },
  {
    id: "cheesecake", name: "Cheesecake", category: "sweet", aliases: ["cheesecake","çizkek","san sebastian"], typicalPortionG: 120, portions: [{ unit: "dilim", grams: 120 }],
    ingredients: [{ foodId: "cream_cheese", grams: 600 }, { foodId: "sugar", grams: 150 }, { foodId: "egg", grams: 150 }, { foodId: "cream_heavy", grams: 200 }, { foodId: "butter_cookies", grams: 200 }, { foodId: "butter", grams: 80 }],
    yield: { kind: "fndds", foodCode: 53104500 },
  },
  {
    id: "elmali_kurabiye", name: "Elmalı kurabiye", category: "sweet", aliases: ["elmalı kurabiye"], typicalPortionG: 60, portions: [{ unit: "adet", grams: 30 }],
    ingredients: [{ foodId: "flour", grams: 400 }, { foodId: "butter", grams: 150 }, { foodId: "yogurt", grams: 100 }, { foodId: "powdered_sugar", grams: 60 }, { foodId: "apple", grams: 400 }, { foodId: "sugar", grams: 100 }, { foodId: "walnuts", grams: 50 }, { foodId: "cinnamon", grams: 5 }, { foodId: "baking_powder", grams: 10 }],
    yield: { kind: "fndds", foodCode: 53241600 },
  },
];
