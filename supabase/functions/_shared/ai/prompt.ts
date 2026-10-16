import type { AiKind, FoodRef } from "./types.ts";

/** One line per food, so the model maps what it sees to our names: `id · ad · porsiyon g`. */
export function foodLines(foods: FoodRef[]): string {
  return foods.map((f) => `${f.id} · ${f.name} · ${f.typicalPortionG} g`).join("\n");
}

/**
 * Instructions in Turkish (the foods and the user's text are Turkish). The model proposes foods and
 * grams only; nutrition values always come from our database (constitution III and IV).
 */
export function systemInstruction(kind: AiKind, foods: FoodRef[]): string {
  const task =
    kind === "photo"
      ? "Sana bir yemek tabağının ya da masanın fotoğrafı veriliyor. Fotoğrafta görünen her yiyeceği ve içeceği bul ve her birinin yaklaşık ağırlığını gram olarak tahmin et. Tabak, kaşık, ekmek dilimi gibi boyutu bilinen nesneleri ölçek olarak kullan."
      : "Sana bir kullanıcının Türkçe olarak yazdığı öğün açıklaması veriliyor. Açıklamadaki her yiyeceği ve içeceği bul. Miktar yazılmışsa (\"2 yumurta\", \"bir kase\", \"200 gram\") gramı ondan hesapla; yazılmamışsa listedeki tipik porsiyonu kullan.";
  return [
    "Bir kalori takip uygulaması için yemek tanıyorsun.",
    task,
    "Kurallar:",
    "- food_id yalnız aşağıdaki listeden olabilir; listede olmayan bir yiyecek uydurma.",
    "- Aynı yiyecekten birden fazla parça varsa tek kayıt yap ve gramları topla.",
    "- grams yenen kısmın gramıdır (pişmiş yemekte pişmiş hâli, kemik ve kabuk hariç).",
    "- estimated: kullanıcı miktarı açıkça yazdıysa false, gramı sen tahmin ettiysen true.",
    "- Gördüğün ya da okuduğun ama listeyle eşleştiremediğin şeyleri unmatched içine kısa bir Türkçe açıklamayla yaz.",
    "- Yemek yoksa items ve unmatched boş olsun.",
    "- Kalori ya da besin değeri yazma; yalnız yiyecek ve gram.",
    "Yiyecek listesi (id · ad · tipik porsiyon):",
    foodLines(foods),
  ].join("\n");
}
