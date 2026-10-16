# Feature Specification: AI Logging

**Feature Branch**: `003-ai-logging`

**Created**: 2026-10-16

**Status**: Draft

**Input**: User description: "003 AI logging for the store MVP: log a meal from a photo or from a short Turkish text description through one hosted vision model (Gemini) behind our server; the model only proposes foods from our food list and approximate grams, the user confirms the grams on the existing review step. Free with a per-user daily AI quota (start at 5 a day). When the model is unavailable, logging still works through search and an on-device text preview. Label reading and barcode come with own foods later."

## Clarifications

### Session 2026-10-16

- Q: Is the photo kept after the analysis? → A: No; it is discarded after the analysis and the meal keeps only its foods and grams.
- Q: What uses up the daily AI allowance? → A: Each photo analysis and each text analysis the user explicitly sends to the AI uses one; the on-device text preview never does.
- Q: When does the AI analyse typed text? → A: Only when the user taps "AI ile analiz et"; never automatically, not even when the preview cannot match a phrase.
- Q: Who builds the photo evaluation set? → A: The owner photographs and weighs 30 home meals over 2–3 weeks; the model is chosen on that set.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Log a meal from a photo (Priority: P1)

The user takes a photo of their plate (or picks one from the gallery). Within seconds the app
shows the foods it recognised, each matched to a food in our list with an estimated weight, on the
same review step that search logging uses. The user corrects any food or weight and saves.

**Why this priority**: Photo logging is the headline of the store MVP and the fastest way to log a
mixed Turkish plate; typing several foods and weights is what makes people stop logging.

**Independent Test**: Photograph a plate of known foods weighed on a kitchen scale, save the meal,
and check that the saved items are foods from our list with the weights the user confirmed and
totals computed from our per-100 g values.

**Acceptance Scenarios**:

1. **Given** a signed-in user with AI logs left today, **When** they photograph a plate of
   mercimek çorbası and a slice of bread, **Then** the review step lists "Mercimek çorbası" and
   "Beyaz ekmek" with estimated grams, each editable, and nothing is saved until they confirm.
2. **Given** the review step from a photo, **When** the user changes a weight, swaps a food for
   another one from search, removes a food or adds one, **Then** the saved meal holds exactly what
   the review step showed.
3. **Given** a photo with a food the model recognised but our list does not contain, **When** the
   review step opens, **Then** that item is shown as not found with the model's description and a
   one-tap search prefilled with it, and it is not saved unless the user picks a food.
4. **Given** a photo that shows no food, **When** the analysis finishes, **Then** the user sees a
   Turkish message that no food was found, with options to retake, type the meal or search; the
   attempt does not use up an AI log.

---

### User Story 2 - Log a meal by typing what I ate (Priority: P1)

The user types a short Turkish description such as "2 yumurta, 1 dilim beyaz peynir, yarım simit"
and gets the same review step with each food matched and its grams computed from the stated
amounts.

**Why this priority**: Equal to photos in the MVP: it works where a photo is impractical (eaten
already, at a restaurant table, a snack) and it is the path that still works without the model.

**Independent Test**: Type a set of committed test phrases and check that the review step shows the
expected foods and grams; save one and check the totals.

**Acceptance Scenarios**:

1. **Given** the text field, **When** the user types "2 yumurta ve yarım simit", **Then** an
   instant on-device preview lists "Yumurta 100 g" and "Simit 60 g" (two eggs at 50 g, half of a
   120 g simit) before any server answer arrives.
2. **Given** the preview, **When** the user sends the text for AI analysis, **Then** the review step
   shows the model's matches, using the stated amounts and our portions for the grams, and the user
   confirms as in Story 1.
3. **Given** a phrase with Turkish number words, suffixes or negation ("iki yüz gram tavuk",
   "şekersiz çay", "bir buçuk dilim ekmek"), **When** it is parsed, **Then** the amount and the
   food are read correctly ("şekersiz" picks the unsweetened tea, not sugar).
4. **Given** a phrase with no amount ("mercimek çorbası"), **When** it is matched, **Then** the
   food's typical portion is proposed and marked as an estimate.

---

### User Story 3 - Know my AI allowance and keep logging when it runs out (Priority: P2)

The user sees how many AI logs are left today. When they are used up, or the AI service is down,
the app says so plainly and offers the ways that still work: the on-device text preview and
search.

**Why this priority**: Keeps the model cost bounded before any subscription exists, and keeps the
app usable on bad days; without it the AI paths are a risk, but they still work for a first test.

**Independent Test**: Use up a test account's daily allowance, check that a further AI request is
refused with the Turkish message and that typing and search still log a meal; then check that the
allowance is back after the user's local midnight.

**Acceptance Scenarios**:

1. **Given** a user with 2 AI logs left, **When** they open photo or text logging, **Then** they see
   "Bugün 2 AI kaydın kaldı" (or equivalent) before sending anything.
2. **Given** a user with no AI logs left, **When** they try a photo, **Then** no analysis runs, they
   see when the allowance resets, and the text preview and search remain available.
3. **Given** the AI service fails or times out, **When** the user sent a photo or text, **Then**
   they see that photo analysis is unavailable right now, the attempt does not use up an AI log, and
   the text preview and search are offered.
4. **Given** the user's local day changes, **When** they open AI logging, **Then** the full daily
   allowance is available again.

---

### Edge Cases

- A blurry, dark or very large photo: the app shrinks it before sending; if it is still unusable,
  the user is asked to retake it. Photos are never sent at full size.
- A photo of a packaged product or a nutrition label: treated like any photo (the generic food if it
  can be named); reading labels and barcodes is a later feature and the app says so if no food is
  found.
- Several portions of one food on the plate (two köfte skewers): one item with the summed weight.
- Implausible estimates (a 3 kg plate of rice): weights are capped at the existing 5000 g per-item
  limit and flagged for the user to check; no saved item ever exceeds the limit.
- The user leaves the screen during analysis: nothing is saved; a finished analysis is discarded or
  shown when they return, never saved silently.
- The same request sent twice (double tap, retry after a network drop): counted and charged once.
- Offline: photo and AI text analysis are unavailable with a clear message; the on-device preview
  still parses the text, and matching the parsed foods waits for the connection like search does.
- Text in another language or nonsense: the preview shows what it could not match; the AI path
  returns no foods and the attempt is not counted.
- A meal mixing foods the list knows and does not know: the known ones are matched, the unknown
  ones are shown as not found (Story 1, scenario 3).

## Requirements *(mandatory)*

### Functional Requirements

**Photo logging**

- **FR-001**: Users MUST be able to start a meal log from a new camera photo or from a photo in
  their gallery, one photo per log.
- **FR-002**: The app MUST shrink and re-encode the photo on the device before sending it, removing
  location and other metadata, and MUST NOT send a photo larger than the agreed pixel and byte
  limits.
- **FR-003**: The analysis MUST return only foods from our food list (by their identifiers), each
  with an estimated weight in grams, plus a short description for anything it saw but could not
  match.
- **FR-004**: Photo analysis MUST end on the existing review step, where every item's weight is
  editable and items can be swapped, removed or added before saving; nothing is saved without the
  user's confirmation.
- **FR-005**: The photo MUST NOT be kept after the analysis; the saved meal holds its items, not the
  image.

**Text logging**

- **FR-006**: Users MUST be able to describe a meal in Turkish free text of up to 300 characters.
- **FR-007**: An on-device, rule-based preview MUST parse the text as the user types: amounts in
  digits, Turkish number words ("bir", "iki yüz", "buçuk", "yarım", "çeyrek"), units that exist as
  our portions (adet, dilim, kase, su bardağı, yemek kaşığı, …) and grams, and split the text into
  food phrases; it MUST work without the AI service and without using an AI log.
- **FR-008**: Each parsed phrase MUST be matched to our foods through the same food search the app
  already uses, and weights MUST come from the stated amount times our portion weights, or from the
  food's typical portion (marked as an estimate) when no amount is stated.
- **FR-009**: The user MUST be able to send the text for AI analysis with an explicit "AI ile analiz
  et" action, which returns foods and grams under the same rules as FR-003 and ends on the review
  step as in FR-004. The app MUST NOT call the AI for text on its own, including when the preview
  leaves a phrase unmatched; the user can save from the preview without using an AI log.
- **FR-010**: Parsing MUST respect Turkish negation suffixes (-sız/-siz/-suz/-süz) so that
  "şekersiz", "yağsız" select the matching food rather than the negated ingredient.

**Values and trust**

- **FR-011**: Nutrition values MUST always come from our food list; the model's output never sets
  calories or macros, and saved meals are computed exactly as search-logged meals are.
- **FR-012**: Model output MUST be checked against the agreed answer format and our food list before
  it reaches the app; unknown identifiers, missing or non-positive weights are dropped or shown as
  not found, and weights above the per-item limit are capped and flagged.

**Allowance and availability**

- **FR-013**: Each user MUST have a daily allowance of AI analyses, starting at 5, enforced on the
  server and resetting at midnight in the user's own time zone. Each photo analysis and each text
  analysis sent with "AI ile analiz et" uses one; the on-device preview uses none.
- **FR-014**: An analysis that fails, times out, finds no food, or is a retry of the same request
  MUST NOT use up the allowance.
- **FR-015**: The app MUST show the remaining allowance before the user sends a photo or text, and a
  clear Turkish message with the reset time when none is left.
- **FR-016**: When the AI service is unavailable or the allowance is used up, the app MUST say so and
  offer the on-device text preview and search; logging a meal MUST remain possible.
- **FR-017**: Only signed-in users MAY use AI analysis; requests MUST be size-limited and rejected
  when they exceed the limits.

**Model choice**

- **FR-018**: The project MUST keep a committed evaluation set of real Turkish meals (photos with
  weighed contents) and phrases (with expected foods and grams), and the model in use MUST be chosen
  by its results on that set, recording accuracy, response time and cost per analysis.
- **FR-019**: All model calls MUST go through one server-side boundary; no model key or vendor call
  exists in the app.

**Language**

- **FR-020**: All user-facing text (states, errors, allowance, not-found items) MUST be Turkish
  with "sen".

### Key Entities

- **AI analysis**: one request by one user (photo or text), its outcome (foods found, none found,
  failed), whether it counted against the allowance, its response time and model, and a request key
  that makes retries count once. Holds no image.
- **Daily allowance**: per user and local day, the number of counted analyses and the limit in
  force.
- **Proposed item**: a food from our list with estimated grams and whether the grams are an
  estimate, or a not-found description; exists only until the user saves or leaves the review step.
- **Evaluation case**: a committed photo or phrase with its expected foods and weighed grams, used to
  score models.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On the photo evaluation set, at least 80 % of the foods on each plate appear among the
  proposed items, and fewer than 10 % of proposed items are foods that are not on the plate.
- **SC-002**: On the photo evaluation set, the median weight estimate is within 30 % of the weighed
  amount for correctly found foods.
- **SC-003**: On the phrase evaluation set, the on-device preview alone finds the expected foods and
  grams for at least 90 % of phrases that state an amount; the AI path for at least 95 %.
- **SC-004**: 90 % of photo analyses show the review step within 8 seconds of sending on a 4G
  connection; the text preview updates within 0.3 seconds of the last keystroke.
- **SC-005**: A user logs a three-food plate by photo, including correcting one weight, in under
  30 seconds.
- **SC-006**: No user can complete more AI analyses in a local day than the allowance, verified by
  repeated and concurrent requests.
- **SC-007**: With the AI service switched off, a user can still log a meal from text or search, and
  sees the unavailability message in 100 % of attempts.
- **SC-008**: Every saved meal from a photo or text has the same totals as the same foods and grams
  logged through search.

## Assumptions

- Scope follows the store MVP (`specs/ROADMAP.md`, 2026-10-15): photo and text logging only. Label
  reading belongs with own foods and barcode with 002 part B, both after the MVP.
- The model is Gemini, chosen among the owner's candidates by the evaluation set; the free tier is
  for development only, and the paid tier serves users (owner decision 2026-10-09). The owner
  provides the paid API key as a server secret before the TestFlight build.
- The allowance is free for every user at the start (5 a day); a subscription (006) may change the
  limit later without changing this feature's behaviour.
- Photos are not stored. If saved meals should show their photo later, that is a separate change
  with its own storage and privacy review.
- The review step, food search, portions, the 5000 g per-item limit and meal slots from 001 and 002
  are reused unchanged; the AI paths only fill the review step.
- The owner builds the photo evaluation set: 30 home meals, each weighed per food on a kitchen scale
  and photographed, collected over 2–3 weeks while the rest of 003 is built; the phrase set (at
  least 100 phrases) is written in the repository. Both grow when the model or the prompt changes.
- Users are on a phone with a camera and mobile data; analysis needs a connection, the text preview
  does not.
