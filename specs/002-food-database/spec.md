# Feature Specification: Food Database

**Feature Branch**: `002-food-database`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "002, part A: a food database of about 500 curated foods with good Turkish names, aliases and portions. Raw ingredients from USDA FoodData Central; Turkish dishes computed from recipes or entered from a cited label. Portions as unit shortcuts under the gram field. Built by a reproducible data pipeline in the repository with the source of every value recorded. TürKomp is not used (commercial use is paid). Barcode scanning, own foods and saved meals are later parts of 002."

## Clarifications

### Session 2026-10-15

- Q: How do portion shortcuts handle more than one unit (2 eggs, 3 slices)? → A: A unit chip plus a count stepper: tapping a unit writes one unit's grams; −/+ changes the count and the grams follow (unit weight × count).
- Q: Do branded packaged products belong in the part A list? → A: No, generic foods only; a label may serve only as the cited source for a generic food, and branded products come with barcode scanning.
- Q: Do alcoholic drinks belong in the list? → A: Yes; every food carries alcohol grams per 100 g (0 for most foods), and energy checks count alcohol at 7 kcal/g.
- Q: In what form does the owner review the list before release? → A: A searchable, filterable HTML page (published like the screen preview), plus a version-controlled text summary whose diff shows what changed.
- Q: Where does a recipe's cooked weight come from? → A: By default from published USDA cooking yield factors, recorded as the source; when the owner cooks and weighs a dish, that measurement replaces the factor for that dish.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find what I eat in Turkish (Priority: P1)

The user searches in Turkish, with suffixes or without Turkish letters, and finds the everyday raw
ingredients and Turkish dishes they eat, with the expected food first.

**Why this priority**: Search is the only way to log a meal today, and the current 79 foods run
out within days; every other part of 002 builds on a broad, correct food list.

**Independent Test**: Run the agreed list of everyday searches (at least 100 queries such as
"tavuk", "pirinç", "yumurta", "mercimek", "karnıyarık", "beyaz peynir", "elma"); the expected food
is the first result for each.

**Acceptance Scenarios**:

1. **Given** the food list, **When** the user searches a staple by its bare name (pirinç, kıyma,
   tavuk göğsü), **Then** the raw or dry food comes first and cooked forms carry their state in the
   name ("(pişmiş)", "(haşlanmış)").
2. **Given** the food list, **When** the user searches a Turkish dish (mercimek çorbası, kuru
   fasulye, menemen), **Then** the dish is found with its value per 100 g of the cooked dish.
3. **Given** the food list, **When** the user types with a suffix or without Turkish letters
   ("tavuğu", "pilavi", "sut"), **Then** the same food is found as with the proper spelling.

---

### User Story 2 - Log with portion shortcuts (Priority: P2)

On the review step, the user taps a portion of the chosen food ("1 adet", "1 dilim",
"1 su bardağı", "1 porsiyon") instead of typing grams; the grams appear in the field and stay
editable.

**Why this priority**: Weighing every item is slow; most everyday foods have a natural unit.
Logging still works with grams alone, so this follows the food list.

**Independent Test**: Pick "Yumurta", tap the "adet" unit, then "+" once; the gram field shows the
unit weight times 2, and the totals follow; save and the meal holds those grams.

**Acceptance Scenarios**:

1. **Given** a chosen food with portions, **When** the user taps a portion, **Then** its grams are
   written into the empty gram field and the live totals update.
2. **Given** grams already typed, **When** the user taps a portion, **Then** the field is replaced
   with the portion's grams (one tap, one value; no hidden adding up).
3. **Given** a selected unit, **When** the user presses "+" or "−", **Then** the count changes by
   one (never below 1) and the gram field shows unit weight × count; typing grams by hand clears
   the unit selection.
4. **Given** a food without unit portions, **When** the review step shows it, **Then** only the
   typical portion is offered.

---

### User Story 3 - Trust where the numbers come from (Priority: P2)

The owner can see, for every food, where its values come from (a USDA entry, a recipe of USDA
ingredients, or a cited label) and review the whole list in a readable table before it ships.

**Why this priority**: Wrong values silently spoil every day logged with them; the owner decides
what ships. It runs alongside Story 1 as its quality gate.

**Independent Test**: Regenerate the food list from its sources; the result is identical to the
shipped list, and the review table lists every food with its source, kcal and portions.

**Acceptance Scenarios**:

1. **Given** the sources, **When** the list is regenerated, **Then** the output is the same
   byte for byte (reproducible).
2. **Given** a recipe dish, **When** the owner opens its entry in the review table, **Then** the
   ingredients, their grams and the cooked weight are listed with the computed values.
3. **Given** a food that changed since the last release, **When** the list is regenerated,
   **Then** the change shows as a readable difference in the version-controlled summary.
4. **Given** the HTML review page, **When** the owner types a name or picks a category or source,
   **Then** the table narrows to the matching foods.

---

### Edge Cases

- A food the user logged earlier changes its values or name in a new release: past meals keep the
  values they were saved with; only new logs use the new values.
- A food is removed from the list: foods that appear in any saved meal are never deleted; they are
  hidden from search instead.
- Two foods would share an alias: the build fails and names both foods.
- A recipe's cooked weight is missing or larger than the sum of its ingredients plus added water:
  the build fails for that dish.
- A USDA entry used by the list is missing in the pinned USDA release: the build fails and names it.
- A portion would exceed the gram limit (5000 g) or be zero: the build fails.
- A food's energy disagrees with 4 kcal/g protein + 4 kcal/g carbohydrate + 9 kcal/g fat + 7 kcal/g
  alcohol by more than 20 % (or 10 kcal, whichever is larger): the build fails and names the food (USDA's food-specific Atwater factors and fibre stay
  inside that margin).
- A search matches dozens of foods ("et"): results stay ordered by match quality, raw/staple forms
  first, and the list stays short enough to scan (as today).

## Requirements *(mandatory)*

### Functional Requirements

**Food list**

- **FR-001**: The food list MUST contain at least 450 foods covering Turkish everyday eating: meat,
  poultry, fish, eggs, dairy, legumes, grains and bread, vegetables, fruit, nuts and seeds, oils,
  sweets, drinks (alcoholic drinks included) and at least 80 Turkish dishes.
- **FR-002**: Every food MUST have a Turkish display name (at most 80 characters), a category, its
  energy, protein, carbohydrate, fat and alcohol (0 when none) per 100 g, a typical portion in
  grams, and at least one
  search alias.
- **FR-003**: Raw ingredients MUST take their values from a named USDA FoodData Central entry of a
  pinned release; values from TürKomp MUST NOT be used.
- **FR-004**: Turkish dishes MUST take their values either from a recipe (ingredients from the list
  in raw grams plus the cooked weight of the whole pot) or from a cited product label; the values
  per 100 g of the cooked dish are computed, not typed.
- **FR-004a**: A recipe's cooked weight MUST come from a published USDA cooking yield factor (named
  in its source) unless the owner has weighed the cooked dish; a recorded weighing (date and
  grams) replaces the factor for that dish, and the review table shows which one was used.
- **FR-004b**: The list MUST hold generic foods only; display names and aliases MUST NOT contain
  brand names. A product label may be the cited source for a generic food (e.g. "Gofret") but the
  brand stays in the source reference only.
- **FR-005**: Bare staple names MUST find the raw or dry form first; cooked or prepared forms MUST
  name their state (owner rule, 2026-10-11).
- **FR-006**: The current 79 foods MUST keep their identities so saved meals stay linked; their
  values are re-sourced under FR-003/FR-004 (including kaşar, white bread and simit).

**Portions**

- **FR-007**: A food MAY have named unit portions ("adet", "dilim", "su bardağı", "yemek kaşığı",
  "porsiyon", …) each with its weight in grams, greater than 0 and at most 5000 g.
- **FR-008**: The review step MUST offer the food's portions as shortcuts that write the grams into
  the gram field, with a count stepper (−/+, minimum 1) for the selected unit so grams = unit
  weight × count; the gram field stays the only value that is saved (FR-013 of 001 still applies).

**Search**

- **FR-009**: Search MUST keep the behaviour of 001 (Turkish normalisation, suffix stems, ranking by
  match quality) over the larger list, and the agreed list of everyday searches MUST return the
  expected food first.
- **FR-010**: Foods withdrawn from the list MUST disappear from search but stay readable in meals
  that use them.

**Source and build**

- **FR-011**: Every food MUST record its source kind (USDA entry, recipe, label) and a reference
  (the USDA entry id, the recipe name, or the label's product and date).
- **FR-012**: The list MUST be generated from version-controlled sources by a repeatable build that
  produces identical output for identical inputs and fails on any rule above (aliases unique,
  values within limits, energy consistent with the macros and alcohol, portions valid, recipes
  complete, referenced USDA entries present).
- **FR-013**: The build MUST also produce a review table (name, category, source, kcal, macros and
  alcohol per 100 g, typical portion, unit portions; recipe dishes with their ingredients) in two
  forms: a single-file HTML page the owner can search and filter by name, category and source,
  published like the screen preview, and a version-controlled plain-text summary whose diff shows
  every changed food.
- **FR-014**: Shipping the list MUST NOT change any value already saved in a meal.
- **FR-015**: The food data MUST credit its sources where the app lists its data sources (USDA
  FoodData Central; label sources as cited).

### Key Entities

- **Food**: an item the user can log; display name, category, values per 100 g (energy, protein,
  carbohydrate, fat, alcohol), typical portion,
  unit portions, source kind and reference, and whether it is offered in search.
- **Alias**: a search name of a food (normalised for Turkish); unique across all foods.
- **Unit portion**: a named amount of a food ("1 dilim") and its weight in grams.
- **Recipe**: a Turkish dish defined by ingredients (foods in raw grams), added water and the cooked
  weight of the whole (from a USDA yield factor or the owner's dated weighing); yields the dish's
  values per 100 g.
- **Source reference**: where a food's values come from: a USDA FoodData Central entry of the pinned
  release, a recipe, or a dated product label.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The shipped list holds at least 450 foods, at least 80 of them Turkish dishes.
- **SC-002**: At least 95 of the 100 agreed everyday searches return the expected food first, and
  all 100 return it within the first three results.
- **SC-003**: Regenerating the list from its sources twice gives identical output.
- **SC-004**: Every food in the shipped list has a recorded source; 0 values come from TürKomp.
- **SC-005**: Logging a food that has unit portions takes at most one tap for the amount (no
  typing) in the common case of one unit.
- **SC-006**: Search results still appear within 300 ms of the last keystroke on a typical phone
  connection, as in 001.
- **SC-007**: After the release, every meal saved before it shows exactly the same totals as before.
- **SC-008**: The owner has reviewed the generated review table and signed it off before release.

## Assumptions

- Part A of 002 only. Barcode scanning (Open Food Facts), the user's own foods and saved meals are
  separate later parts of 002 with their own specs; branded products arrive with barcode scanning.
- USDA FoodData Central (SR Legacy and Foundation) is in the public domain and can be shipped in a
  commercial app with attribution; a single release is pinned so builds are reproducible.
- TürKomp is not used: its commercial use requires a paid licence and a contract (owner decision,
  2026-10-13). The constitution's "TürKomp (licence to be confirmed)" line is updated accordingly.
  The source fields leave room to add a licensed source later.
- The owner weighs food raw; staples default to raw/dry values (owner rule, 2026-10-11).
- Recipe dishes use typical home recipes; the owner may adjust ingredients during review.
- The agreed list of everyday searches is drafted by the agent and confirmed by the owner during
  review.
- The food list is read-only to users in this part; nothing users enter is added to it.
