# Contract: Food data pipeline (`tools/fooddata`)

A workspace that is never shipped. Commands run from the repository root.

| Command | Network | Writes | Fails when |
|---|---|---|---|
| `npm run fetch -w fooddata` | yes | `tools/fooddata/sources/usda/extract.json` | a downloaded zip's SHA-256 differs from `release.json`; a referenced FDC id is missing from the release (names it) |
| `npm run build -w fooddata` | no | `tools/fooddata/out/foods.txt`, `tools/fooddata/dist/review.html`, `supabase/tests/database/search_cases.test.sql`, and (with `--release`) a new `supabase/migrations/<version>_food_list_<n>.sql` | any rule in [data-model.md](../data-model.md) "Build rules"; reports every failure, not only the first |
| `npm run check -w fooddata` | no | nothing | building into a temp dir gives a `foods.txt`, test file or latest list migration that differs from the committed ones (CI) |
| `npm test -w fooddata` | no | nothing | the build rules' unit tests fail |

## Determinism (FR-012, SC-003)

- Foods sorted by id; aliases by normalised text; portions by source order.
- Numbers printed with a fixed number of decimals (per-100 g values 2, grams 1), `.` as the
  separator; recipe values rounded half-up after the full-precision calculation.
- UTF-8, `\n` line endings, no timestamps; the migration version is passed in (`--release
  20261020000100`), not read from the clock.
- Two builds from the same sources give byte-identical files.

## `foods.txt` line format

```text
<id> | <name_tr> | <category> | <source_ref> | <kcal> kcal P<p> C<c> F<f> A<a> | typ <g> g | <unit> <g> g; …
```

Recipe dishes add an indented line per ingredient and one for water and yield.

## `review.html`

Single file, inline CSS/JS, no network. Columns as in FR-013; search box (name and aliases),
category and source-kind filters; recipe rows expand; foods whose `foods.txt` line differs from the
committed one are marked "değişti". Published as a claude.ai artifact for the owner's sign-off
(SC-008).
