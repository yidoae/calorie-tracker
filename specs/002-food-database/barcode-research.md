# Barcode scanning research (002 part B)

**Date**: 2026-11-03 · **Author**: Admin agent · **Status**: research for the owner, no code yet ·
**Summary page**: https://claude.ai/artifact/FmFAhfP7wJ4nviz339UMtV (private)

## What is already decided

- 002 part A ships generic foods only; branded products arrive with barcode scanning, and the
  planned source is Open Food Facts ([spec.md](spec.md), Clarifications and Assumptions;
  [ROADMAP.md](../ROADMAP.md) row 002).
- Barcode is one of the four logging paths and, like every path, ends on the review step where the
  user confirms the grams (constitution, principle IV and "In scope"). It must keep working when the
  AI model is down (constitution, principle V).
- Label reading belongs with own foods (002 part C); barcode is 002 part B; both after the MVP
  ([003 spec](../003-ai-logging/spec.md), Assumptions).
- Server-owned numbers (constitution III): the app sends a food id and grams; per-100 g values come
  from the database. A scanned product therefore has to become a row the server owns before it can
  be logged; the app must never send label values with a meal.
- A large product table needs a trigram prefilter in search ([research.md](research.md) §5).

This file answers: can a scan give nutrition data, how well for products sold in Turkey, and which
approach to build.

## 1. Open Food Facts (OFF)

**Coverage in Turkey, measured 2026-11-03** through the search API
(`/api/v2/search?countries_tags_en=turkey`):

| Measure | Count |
|---|---|
| Products tagged as sold in Turkey | 11,653 |
| … with state `nutrition-facts-completed` | 6,079 (52 %) |
| … with state `nutrition-facts-to-be-completed` | 5,574 (48 %) |

A per-product sample (share with 868/869 prefix, energy plausibility) was attempted but the
search endpoint kept answering "Page temporarily unavailable"; measure it on the dump when part B
starts (DuckDB over the Parquet export, `countries_tags` contains `en:turkey`).

About 6k complete products is a useful seed, not full coverage (a single supermarket chain
carries more food SKUs than that; estimate, not measured): expect the big national brands'
popular items to hit and private labels, regional and new products to miss.

Barcode prefix 868/869 means the code was issued by GS1 Türkiye, not that the product is Turkish
or sold only in Turkey ([TOBB GS1 brochure](https://tobb.org.tr/BilgiHizmetleri/Documents/Brosur/gs1.pdf)).
The OFF search API cannot filter by code prefix (a `code=868*` query returns 0), so prefix
counts come from the sample above or the dump.

**Access** ([API docs](https://openfoodfacts.github.io/openfoodfacts-server/api/)):
- Reads need no key, only a `User-Agent: AppName/Version (email)` header.
- Limits: 15 requests/min/IP for product reads, 10/min/IP for search; over the limit returns 503
  and can lead to an IP ban. Search-as-you-type is explicitly discouraged.
- For more than a few hundred products, use the nightly dumps (JSONL, CSV) or the
  [Parquet export on Hugging Face](https://huggingface.co/datasets/openfoodfacts/product-database);
  daily delta files cover the last 14 days ([data page](https://world.openfoodfacts.org/data)).
- During this research the search endpoint returned "Page temporarily unavailable" on several
  calls; a live dependency per scan would inherit that.

The limit is per IP. If our Edge Function proxied every scan to OFF, all users would share one
Supabase IP and 15 lookups a minute: fine for a beta, not for launch. Calling OFF from the phone
spreads the limit over users but puts label values on the client, which constitution III forbids
for logging. Both point to a local copy.

**Licence** ([terms](https://world.openfoodfacts.org/terms-of-use),
[ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/),
[API FAQ](https://support.openfoodfacts.org/help/en-gb/12-api-data-reuse/94-are-there-conditions-to-use-the-api)):
- Database: ODbL; individual values: Database Contents License; photos: CC BY-SA 3.0 (photos may
  also carry trademark/design rights).
- Attribution: name the licence and credit Open Food Facts with a link, per product where we show
  product data.
- Share-alike (ODbL 4.4, 4.6): a **derivative database** we use publicly (our imported OFF table,
  including our corrections) must stay under ODbL, and we must offer it (or a file of our changes)
  free of charge to users who get produced works from it.
- Limits (ODbL 4.5): a **collective database** need not be ODbL. Keeping OFF rows in their own
  table, separate from our USDA/recipe `foods`, keeps our own list and users' data out of
  share-alike. The app screens are produced works: they need the notice, not an open-sourced app.
- Practical consequence: corrections we make to OFF products (and owner-reviewed label entries)
  should be contributed back to OFF, which both satisfies 4.6 and grows Turkish coverage.
- OFF gives no accuracy guarantee and says the data "must not be used for medical purposes"; we
  need the usual plausibility checks (energy vs 4P+4C+9F, ranges) before a product is loggable.

## 2. GS1 Türkiye / GEPIR / Verified by GS1

GS1 Türkiye (authorised by TOBB) issues the 868/869 company prefixes
([TOBB brochure](https://tobb.org.tr/BilgiHizmetleri/Documents/Brosur/gs1.pdf)). GEPIR answers
"which company owns this barcode". Verified by GS1 holds seven core attributes only: GTIN, brand,
product description, image, GPC category, net content and target market
([GS1 UK](https://www.gs1uk.org/standards-services/data-services/verified-by-gs1),
[GS1 support](https://support.gs1.org/support/solutions/articles/43000734119-what-information-is-available-in-verified-by-gs1-)).
**No nutrition.** Useful at most to name an unknown product before the user photographs its label.
Nutrition flows through GDSN between brand owners and retailers, which is a paid B2B network, not
an app API.

## 3. Commercial APIs

| Source | Turkish coverage | Price | Terms that matter |
|---|---|---|---|
| FatSecret Platform | "62+ countries", 90 %+ global barcode claim; Turkey not named on the public page ([editions](https://platform.fatsecret.com/api-editions)) | Basic and Premier Free: US data only; Premier: quote, priced per market | Premier needs a sales contact; ask for a Turkey market quote and caching rights |
| Nutritionix (Syndigo) | US-focused; no country figures published ([API guide](https://docx.syndigo.com/developers/docs/nutritionix-api-guide)) | quote only ([comparison](https://about.greenchoicenow.com/nutrition-data-api-comparison)) | not a fit |
| Edamam Food Database | ~615k UPCs, mainly US ([product page](https://developer.edamam.com/food-database-api)) | from about $14/month (third-party listing, [apis.io](https://apis.io/plans/edamam/edamam-plans-pricing/)) | caching only on some paid plans |
| USDA FDC Branded | US labels via GDSN/Label Insight ([GBFPD docs](https://fdc.nal.usda.gov/GBFPD_Documentation)) | free, public domain | almost no Turkish products |

Only FatSecret Premier could plausibly cover Turkey, and its price and coverage are unknown until
the owner asks. All of them add per-request cost and terms that usually limit storing values,
which conflicts with copying values into our own rows.

## 4. Turkish retailers

No public data API from Migros, A101, BİM, ŞOK or Getir turned up
([search summary: scrapers only](https://apify.com/caulleonard/tr-aktuel-scraper)). Trendyol's API
is for its marketplace sellers to manage their own listings
([Trendyol developers](https://developers.trendyol.com/en/docs/overview)), not a product data feed.
Migros shows per-100 g tables on its product pages
([example](https://www.migros.com.tr/migros-un-1-kg-p-4c7705)), but taking them would be scraping,
which is out. A data partnership with a retailer is a business decision for later.

## 5. Turkish labelling rules (TGK)

The Turkish Food Codex labelling regulation (Resmî Gazete 26.01.2017, no. 29960 mükerrer;
[text](https://www.lexpera.com.tr/mevzuat/yonetmelikler/turk-gida-kodeksi-gida-etiketleme-ve-tuketicileri-bilgilendirme-yonetmeligi),
[FAO copy](https://faolex.fao.org/docs/pdf/tur171238.pdf)) mirrors EU 1169/2011: prepacked food
must carry a nutrition declaration (energy, fat, saturated fat, carbohydrate, sugars, protein,
salt) **per 100 g or 100 ml**, mandatory since 2020 after the transition
([Tarım ve Orman Bakanlığı announcement, news](https://www.karar.com/gida-etiketlerinde-artik-bilgilendirme-dogru-acik-ve-anlasilir-olacak-376211)).
As in the EU rule, some foods are exempt (for example single-ingredient unprocessed foods and
very small packs); the annex of the regulation has the list.

So almost every packaged product in a Turkish shop has the exact table our `foods` row needs
(kcal, protein, carbs, fat per 100 g). Studies of Turkish labels found gaps in practice (e.g.
62.7 % fully compliant 100 g declarations in one sample,
[Bilgi University thesis](https://openaccess.bilgi.edu.tr/items/5b5bac08-8525-4ea3-a94f-83254aa25e20)),
so a label read still needs checks.

## 6. Label photo fallback (our AI pipeline)

When a barcode misses, the user photographs the nutrition table. The existing `ai-log` Edge
Function (Gemini) reads it into per-100 g kcal/protein/carbs/fat plus name and net weight. That
becomes a **pending product** owned by the server: the user can log it immediately as their own
food (002 part C), and the owner reviews it before it becomes visible to everyone (and is offered
back to OFF). Plausibility rules (energy within 15 % of 4P+4C+9F+7A, P+C+F ≤ 100 g) reject bad
reads. This turns every miss into coverage and costs one AI call, counted against the daily
allowance or given a separate small one.

## 7. Scanner in Expo SDK 57

`expo-camera` (in Expo Go, device only) scans barcodes in `CameraView` with
`barcodeScannerSettings={{ barcodeTypes: [...] }}` and `onBarcodeScanned`; `ean13`, `ean8`,
`upc_a` and `upc_e` are supported. `launchScanner()` opens the system scanner (Google code scanner
on Android, `DataScannerViewController` on iOS 16+), which needs no custom camera screen.
Permission via `useCameraPermissions()` and the config plugin's `cameraPermission` text
([Expo SDK 57 Camera](https://docs.expo.dev/versions/v57.0.0/sdk/camera/)). No new dependency
beyond `expo-camera`; GTIN check digit validated in `@calorie/core` before any lookup.

## Recommendation

**Own product table seeded from the OFF Turkey dump, looked up on our server, with label-photo
fallback and contribution back to OFF.**

1. `tools/fooddata` (or a sibling `tools/offdata`) filters the nightly OFF dump to products sold in
   Turkey with complete, plausible per-100 g energy/protein/carbs/fat, and writes them to a
   separate `barcode_products` table (barcode, name, brand, per-100 g values, net weight, OFF
   source and date). Refresh monthly. Separate table = collective database: only this table is
   ODbL.
2. Lookup is an RPC `food_by_barcode(gtin)` on our database. A hit returns a food id the app logs
   as any other food, so totals stay server-owned (constitution III). No live OFF call per scan.
3. A miss offers "Etiketi çek": the label photo goes through `ai-log`, becomes a pending product
   the user can log at once; the owner approves it for everyone and we push it to OFF.
4. Attribution "Veriler: Open Food Facts katkıcıları (ODbL)" with a link on the product screen and
   in Ayarlar; our corrected OFF table published as a downloadable file (ODbL 4.6).

| | |
|---|---|
| **Cost** | €0 data; Supabase storage for ~6-10k rows is negligible on the free plan; one AI call per label miss |
| **Licence risk** | Low if the OFF table stays separate and we attribute and share our changes; never mix OFF rows into `foods` |
| **Coverage estimate** | ~6k Turkish products with complete nutrition at start; hit rate on popular national brands moderate, low on private labels; grows with every reviewed label |
| **Constitution III** | Kept: the app sends a product id and grams; per-100 g values live in our rows and are copied by the existing triggers |

Revisit FatSecret Premier only if, after launch, the measured miss rate stays high: ask them for a
Turkey-market quote and whether stored values are allowed.

**Before building** (part B spec): measure the hit rate on 50 products from the owner's kitchen
(barcode list), decide whether label entries need owner review before the user can log them, and
add `barcode_products` to the search with the trigram prefilter (research §5).
