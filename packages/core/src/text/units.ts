/**
 * Every portion unit label of the food list (002 food_portions), most used first. The text preview
 * reads these as units ("2 dilim", "1 su bardağı"); tools/fooddata fails the build on a portion
 * whose unit is missing here, so the two never drift apart.
 */
export const PORTION_UNITS = [
  "adet", "yemek kaşığı", "kase", "dilim", "porsiyon", "su bardağı", "çay kaşığı", "kutu", "avuç", "demet",
  "kadeh", "tabak", "şiş", "kare", "şişe", "kupa", "paket", "salkım", "tablet", "top", "shot", "tek",
  "yaprak", "ölçek", "ince belli bardak", "bardak", "duble", "sap", "dürüm",
] as const;
