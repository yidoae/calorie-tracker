import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/layout/SiteHeader";

export const metadata: Metadata = {
  title: "Kaynaklar · Kalori Takip",
};

interface Source {
  title: string;
  detail: string;
  /** What the app uses it for. */
  use: string;
  href?: string;
}

const SECTIONS: { heading: string; sources: Source[] }[] = [
  {
    heading: "Enerji ve kilo",
    sources: [
      {
        title: "Roza AM, Shizgal HM. The Harris Benedict equation reevaluated.",
        detail: "Am J Clin Nutr. 1984;40(1):168–182.",
        use: "Plan sihirbazındaki bazal metabolizma (BMR) hesabı.",
        href: "https://doi.org/10.1093/ajcn/40.1.168",
      },
      {
        title: "Mifflin MD, St Jeor ST ve ark. A new predictive equation for resting energy expenditure in healthy individuals.",
        detail: "Am J Clin Nutr. 1990;51(2):241–247.",
        use: "Eski profil hesaplayıcısı ve FitBot'un hesap araçları.",
        href: "https://doi.org/10.1093/ajcn/51.2.241",
      },
      {
        title: "Hall KD. What is the required energy deficit per unit weight loss?",
        detail: "Int J Obes. 2008;32:573–576.",
        use: "Haftalık değişim tahmini için kullanılan ~7700 kcal/kg kuralının bir basitleştirme olduğunu hatırlatır; tahminler yaklaşıktır.",
        href: "https://doi.org/10.1038/sj.ijo.0803720",
      },
      {
        title: "Dünya Sağlık Örgütü (WHO). Obesity: preventing and managing the global epidemic.",
        detail: "WHO Technical Report Series 894, 2000.",
        use: "Vücut kitle indeksi (BKİ) sınıfları.",
        href: "https://iris.who.int/handle/10665/42330",
      },
    ],
  },
  {
    heading: "Makro ve mikro besinler",
    sources: [
      {
        title: "Jäger R ve ark. International Society of Sports Nutrition position stand: protein and exercise.",
        detail: "J Int Soc Sports Nutr. 2017;14:20.",
        use: "Antrenman yapanlar için 1,6–2,2 g/kg protein aralığı.",
        href: "https://doi.org/10.1186/s12970-017-0177-8",
      },
      {
        title: "Merrill AL, Watt BK. Energy value of foods: basis and derivation.",
        detail: "USDA Agriculture Handbook No. 74, 1973.",
        use: "Atwater katsayıları: protein ve karbonhidrat 4 kcal/g, yağ 9 kcal/g.",
      },
      {
        title: "Institute of Medicine. Dietary Reference Intakes for Energy, Carbohydrate, Fiber, Fat, Fatty Acids, Cholesterol, Protein, and Amino Acids.",
        detail: "National Academies Press, 2005.",
        use: "Lif hedefi: 1000 kcal başına 14 g.",
        href: "https://doi.org/10.17226/10490",
      },
      {
        title: "WHO. Saturated fatty acid and trans-fatty acid intake for adults and children: WHO guideline.",
        detail: "2023.",
        use: "Doymuş yağ sınırı: enerjinin %10'unun altında.",
        href: "https://www.who.int/publications/i/item/9789240073630",
      },
      {
        title: "WHO. Guideline: Sodium intake for adults and children.",
        detail: "2012.",
        use: "Sodyum sınırı: günde 2000 mg'ın altında.",
        href: "https://www.who.int/publications/i/item/9789241504836",
      },
      {
        title: "Avrupa Birliği Tüzüğü (EU) No 1169/2011, Ek XIII Bölüm B.",
        detail: "Gıda bilgilerinin tüketicilere sunulması.",
        use: "Toplam şeker için referans alım: günde 90 g.",
        href: "https://eur-lex.europa.eu/eli/reg/2011/1169/oj",
      },
      {
        title: "EFSA NDA Panel. Scientific Opinion on Dietary Reference Values for water.",
        detail: "EFSA Journal 2010;8(3):1459.",
        use: "Varsayılan su hedefi: kadınlar 2,0 L, erkekler 2,5 L.",
        href: "https://doi.org/10.2903/j.efsa.2010.1459",
      },
    ],
  },
  {
    heading: "Besin verileri",
    sources: [
      {
        title: "USDA FoodData Central.",
        detail: "ABD Tarım Bakanlığı, kamu malı (CC0).",
        use: "Uygulamadaki besin veritabanının (100 g başına değerler) yaklaşık kaynağı; Türk yemekleri tipik tariflere göre ortalanmıştır.",
        href: "https://fdc.nal.usda.gov/",
      },
      {
        title: "Open Food Facts.",
        detail: "Açık veritabanı (ODbL).",
        use: "Barkodla eklenen paketli ürünlerin besin değerleri. Sunucumuz yalnızca barkod numarasını gönderir.",
        href: "https://world.openfoodfacts.org/",
      },
    ],
  },
];

/** /kaynaklar: where every number in the app comes from. */
export default function SourcesPage() {
  return (
    <>
      <SiteHeader />
      <section className="bg-ink text-on-ink">
        <div className="mx-auto w-full max-w-3xl px-4 pt-6 pb-12 sm:px-6">
          <Link href="/" className="link inline-flex items-center gap-1 text-xs text-on-ink-muted hover:text-on-ink">
            <ArrowLeft aria-hidden className="size-3" /> Ana ekrana dön
          </Link>
          <h1 className="mt-4 font-display text-3xl sm:text-5xl">Kaynaklar</h1>
          <p className="mt-2 text-sm text-on-ink-muted">
            Uygulamadaki hedeflerin ve referans değerlerin dayandığı çalışmalar. Değerler genel yetişkin nüfusu içindir ve tıbbi tavsiye yerine geçmez.
          </p>
        </div>
      </section>
      <main className="flex-1 rounded-t-[24px] bg-bg sm:rounded-t-[40px]">
        <div className="mx-auto w-full max-w-3xl space-y-8 px-4 pt-6 pb-24 sm:px-6 lg:pt-10">
          {SECTIONS.map((section) => (
            <section key={section.heading} aria-labelledby={`src-${section.heading}`}>
              <h2 id={`src-${section.heading}`} className="section-title mb-3">
                {section.heading}
              </h2>
              <ul className="card divide-y divide-border">
                {section.sources.map((s) => (
                  <li key={s.title} className="p-4">
                    <p className="text-sm font-semibold text-fg">
                      {s.href ? (
                        <a href={s.href} target="_blank" rel="noreferrer" className="link font-semibold">
                          {s.title}
                        </a>
                      ) : (
                        s.title
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-fg-subtle">{s.detail}</p>
                    <p className="mt-2 text-[13px] text-fg-muted">{s.use}</p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
