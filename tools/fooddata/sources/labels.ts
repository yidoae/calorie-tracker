// Generic foods whose values come from a dated product label (FR-004, FR-004b): the brand stays in
// the label reference only.
export default [
  { id: "kasar_cheese", name: "Kaşar peyniri", category: "dairy", label: { brand: "Pınar", product: "Taze Kaşar Peyniri", date: "2026-10-14", kcal: 343, protein: 25, carbs: 1, fat: 26.5 }, aliases: ["cheddar","cheese","kaşar","kaşar peyniri"], typicalPortionG: 30, portions: [{ unit: "dilim", grams: 20 }] },
  { id: "sucuk", name: "Sucuk", category: "meat", label: { brand: "Pınar", product: "Klasik Kangal Sucuk", date: "2026-10-14", kcal: 428, protein: 16, carbs: 1, fat: 40 }, aliases: ["sucuk"], typicalPortionG: 40, portions: [{ unit: "dilim", grams: 10 }] },
];
