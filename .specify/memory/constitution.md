<!--
Sync Impact Report
- Version change: 2.0.1 → 2.0.2 (PATCH: Food data no longer lists TürKomp; the owner declined its
  paid commercial licence on 2026-10-13, spec 002).
- Previous: 2.0.0 → 2.0.1 (PATCH: the web preview tool is named as review-only).
- Previous: 1.0.0 → 2.0.0 (MAJOR: the product becomes a native mobile app; layers, stack,
  auth and the server boundary are redefined)
- Modified principles:
  - I. Layered Architecture → I. Layered Mobile Architecture (Expo app + packages/core + Supabase)
  - III. Server-Owned Numbers: totals and engine invariants enforced in Postgres / Edge Functions
  - V. One AI Boundary: the boundary is a Supabase Edge Function module
  - VIII. Secure and Abuse-Limited by Default: Row Level Security replaces app-side scoping;
    Supabase Auth replaces custom sessions
  - IX. Tested and Measured: test layers per package; Maestro smoke flow replaces the web E2E
- Added sections: none (Product Scope and Technology Constraints rewritten)
- Removed: the web app, Next.js, Prisma, cookie sessions, username-only accounts
- Templates: plan/spec/tasks templates read this file at runtime; no template edits needed.
- Deferred / to confirm with the owner:
  - The AI plan strategy is out of scope (recommended in the 2026-10-08 review, not yet explicitly
    confirmed).
  - The hosted vision model is chosen by measurement (Principle V); no vendor is fixed here.
  - Where the store-required privacy policy and support pages are hosted (there is no website).
-->

# Calorie Tracker Constitution

## Core Principles

### I. Layered Mobile Architecture

The product is one Expo (React Native) app for iOS and Android, backed by Supabase. The repository
is an npm-workspaces monorepo with three parts:

- `apps/mobile`: the Expo app. Inside it each layer imports only from the layers below:
  `app/` (expo-router screens, entry points only) → `components/` → `hooks/` + `providers/` →
  `services/` → `@calorie/core`.
- `packages/core` (`@calorie/core`): pure, platform-free TypeScript: nutrition math, parsers,
  formatting and the Zod schemas. No React, no I/O, no Supabase client. Both the app and the Edge
  Functions import it, so a rule is written once.
- `supabase/`: SQL migrations (tables, Row Level Security, database functions) and Edge Functions.
  Anything that needs a secret, must not be trusted to the client, or calls an AI model lives here.

Rules:
- `components/ui/*` are presentational: props in, views out. No services, no business rules.
- State and business flows live in hooks; nutrition math never lives in a component.
- `services/` is the only app layer that talks to Supabase (database, storage, auth, functions).
- The layer rules are enforced by ESLint (`no-restricted-imports`), not by convention.

### II. Validated Boundaries

All untrusted data passes a Zod schema from `@calorie/core`: Edge Function request bodies, rows
read from the database into the app, AI model output, third-party API responses and anything read
from device storage. Types are inferred from schemas. TypeScript runs in strict mode and `any` is
not allowed.

### III. Server-Owned Numbers

- Meal totals are computed in the database (a function or trigger over the meal's items), never
  sent by the client.
- There is exactly one nutrition engine (`@calorie/core`): plan building, targets, insights and
  trends all read from it; no parallel formulas.
- Engine invariants hold for every day of every plan and are covered by property tests: each day's
  calories ≥ the sex-specific floor (1200 kcal female, 1500 kcal male), and
  protein·4 + carbs·4 + fat·9 equals the day's calories within rounding.
- Each meal stores its local date (`YYYY-MM-DD`) and the user's IANA time zone; day grouping is
  never re-derived from the device clock.

### IV. The User Confirms the Grams

AI recognises foods and proposes approximate grams; it never decides the logged amount. Every
logging path (photo, barcode, search, text description, own food) ends in a review step where the
user sees and can edit the grams. Nutrition values per 100 g come from the food database, never
from model output. Unknown or implausible values stay empty and are highlighted.

### V. One AI Boundary

- All model calls go through a single shared Edge Function module (the provider boundary); no
  other code calls a vendor API, and no AI key ever ships in the app.
- One hosted vision-capable model serves photo recognition, label reading and free-text meal
  parsing. Its output is constrained to a JSON schema whose food identifiers come from our database
  and is validated again before it is returned.
- The model is chosen and changed by measurement on a committed food eval set (real Turkish meals,
  labels and phrases), recording accuracy, latency and cost per call.
- No machine-learning model runs on the device or in our functions (no CLIP/SAM/OCR, no Ollama).
- When the model is unavailable, logging still works through search, barcode and the on-device
  rule-based text preview, and the app says clearly that photo analysis is unavailable.

### VI. Only Code We Use

- Code that no shipped feature uses is deleted, not kept "for later". Git history is the archive.
- Removing a feature removes all of it in the same change: screens, components, hooks, services,
  functions, migrations' dead objects, types, tests, dependencies, env vars and docs.
- No legacy read paths or compatibility shims without real data that needs them.
- `knip` runs in CI over every workspace and must report no unused files, exports or dependencies
  (documented exceptions only).

### VII. Turkish First

The product is Turkish: UI text, validation and error messages, food names and aliases, store
listings. The voice uses "sen" consistently. Code, comments and engineering docs are English. Text
parsing is tested against real Turkish phrases, including negation (-sız/-siz), number words
("bir", "buçuk", "iki yüz") and suffixes.

### VIII. Secure and Abuse-Limited by Default

- Every table has Row Level Security enabled with policies scoped to `auth.uid()`; there is no table
  without a policy. Storage buckets are private with per-user paths and policies.
- Authentication is Supabase Auth: e-mail + password, Sign in with Apple and Google. Sessions are
  stored in the device's secure storage.
- Every Edge Function verifies the caller's JWT, validates its input, enforces a persistent per-user
  quota (database-backed) and caps request size.
- Photos are resized and re-encoded on the device before upload (which strips EXIF/location); the
  function rejects images over the pixel and byte limits.
- The service-role key and AI keys exist only as Supabase secrets, never in the app or the
  repository.

### IX. Tested and Measured

- `@calorie/core` has unit tests; the nutrition engine has property tests.
- Database policies and functions have tests that run against a local Supabase (another user's rows
  are invisible; totals are recomputed).
- Edge Functions have Deno tests for validation, auth and quota.
- One Maestro smoke flow covers sign-up → onboarding → logging a meal → the dashboard ring.
- AI changes report the food eval result in the PR.
- CI blocks merges unless tests, typecheck, lint and knip pass for every workspace.

## Product Scope and Technology Constraints

**In scope:** four ways to log a meal (photo, barcode, food search, short text description;
reference flow: the Calyra app), plus own foods with label reading, saved meals, meal slots, the
plan wizard (formula-based), titled plan periods, weight and BMI, water, intermittent fasting,
progress and trends, data export and account deletion.

**Out of scope:** any web front end (no website or web app; the `tools/preview` gallery that renders
screens with react-native-web for reviews is an internal tool and is never published to users), the FitBot chat coach, the AI plan
strategy, on-device or in-function ML models, and the local Ollama runtime.

**Stack:** Expo SDK 57 with expo-router, React Native, React 19, TypeScript strict; Supabase
(Postgres with RLS, Auth, Storage, Edge Functions on Deno); Zod 4 in `@calorie/core`; builds and
store submission with EAS. Native modules that Expo Go cannot load (Sign in with Apple, Google
sign-in) are used through a development build.

**Design:** the tofuhq look (ink header band, lime primary action, 4 px grid) carried over as theme
tokens in the app; components never hard-code a colour that is not a token.

**Food data:** a `foods` table with aliases and portions, sourced from USDA FoodData Central and
Open Food Facts; TürKomp is not used (its commercial use needs a paid licence, owner decision
2026-10-13). Users' own foods live in the same table with an owner.

## Development Workflow

- Work follows Spec Kit: `/speckit-specify` → `/speckit-clarify` (when anything is ambiguous) →
  `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`. Specs live in `specs/`.
- Contributors work on a fork or branch and open small pull requests, one concern each. The
  repository owner reviews and merges.
- Database changes ship as committed Supabase migrations in the same PR as the code that needs them.
- `CLAUDE.md` (agent guide) and `README.md` are updated in the same PR whenever behaviour,
  structure or commands change.

## Governance

This constitution overrides other practices in this repository. Amendments are made by pull
request, approved by the repository owner, with a version bump: MAJOR when a principle is removed or
redefined, MINOR when a principle or section is added or materially expanded, PATCH for wording.
Every plan produced by `/speckit-plan` includes a constitution check; a deviation must be justified
in the plan's complexity tracking or the plan is revised. `CLAUDE.md` holds day-to-day guidance and
must not contradict this document.

**Version**: 2.0.2 | **Ratified**: 2026-10-08 | **Last Amended**: 2026-10-15
