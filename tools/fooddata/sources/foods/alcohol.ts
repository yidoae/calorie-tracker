// alcohol: alcoholic drinks with USDA FoodData Central ids; alcohol grams per 100 g come from FDC
// nutrient 1018 and count 7 kcal/g in the energy check (clarify Q3).
export default [
  { id: "beer", name: "Bira", category: "alcohol", fdcId: 168746, aliases: ["bira","fıçı bira"], typicalPortionG: 500, portions: [{ unit: "kutu", grams: 330 }, { unit: "şişe", grams: 500 }, { unit: "bardak", grams: 400 }] },
  { id: "beer_light", name: "Bira (light)", category: "alcohol", fdcId: 168749, aliases: ["light bira"], typicalPortionG: 330, portions: [{ unit: "kutu", grams: 330 }] },
  { id: "wine_red", name: "Kırmızı şarap", category: "alcohol", fdcId: 173190, aliases: ["kırmızı şarap","şarap"], typicalPortionG: 150, portions: [{ unit: "kadeh", grams: 150 }] },
  { id: "wine_white", name: "Beyaz şarap", category: "alcohol", fdcId: 174837, aliases: ["beyaz şarap","roze şarap"], typicalPortionG: 150, portions: [{ unit: "kadeh", grams: 150 }] },
  { id: "wine_dessert", name: "Tatlı şarap", category: "alcohol", fdcId: 173176, aliases: ["tatlı şarap","likör şarabı"], typicalPortionG: 90, portions: [{ unit: "kadeh", grams: 90 }] },
  { id: "raki", name: "Rakı (%45)", category: "alcohol", fdcId: 171920, aliases: ["rakı","duble rakı"], typicalPortionG: 70, portions: [{ unit: "tek", grams: 35 }, { unit: "duble", grams: 70 }] },
  { id: "spirits", name: "Sert içki (votka, viski, cin, rom)", category: "alcohol", fdcId: 174815, aliases: ["votka","viski","cin","rom","tekila"], typicalPortionG: 40, portions: [{ unit: "shot", grams: 40 }] },
  { id: "liqueur", name: "Likör", category: "alcohol", fdcId: 173665, aliases: ["likör"], typicalPortionG: 40, portions: [{ unit: "kadeh", grams: 40 }] },
];
