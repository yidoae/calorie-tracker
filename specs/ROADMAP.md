# Roadmap

Features in the order they are specified and built (Spec Kit). Each one is a separate spec in
`specs/NNN-name/` and ships as its own pull requests. Scope and rules: `.specify/memory/constitution.md`.

| # | Feature | What the user gets | Depends on |
|---|---------|--------------------|------------|
| 001 | Mobile foundation | Expo app for iOS and Android; account with e-mail, Apple, Google; first-time setup; plan wizard; logging by food search; dashboard; past days | — |
| 002 | Food database | TürKomp / USDA / Open Food Facts foods with aliases and portions; barcode scanning; own foods; saved meals | 001 |
| 003 | AI logging | One hosted vision model behind an Edge Function, chosen on a food eval set; photo, label and text-description logging (Calyra-style). Owner's decision (2026-10-09): start with Gemini (paid tier for users; free tier only for development); candidates 3.1 Flash-Lite, 3 Flash, 3.5 Flash-Lite | 001, 002 |
| 004 | Tracking | Weight and BMI, water, intermittent fasting with reminders, progress and trends, titled plan periods | 001 |
| 005 | Account and stores | Data export, account deletion, privacy policy, store listings, EAS builds and submission | 001–004 |
| 006 | Subscription | RevenueCat (`react-native-purchases`): free vs premium entitlement shared across iOS and Android by the Supabase user id, remotely configured paywall, restore purchases, in-app subscription management; RevenueCat webhooks write the entitlement to Supabase, and AI quotas (003) follow it. Products defined in App Store Connect and Google Play Console. Open for the owner: what is free and what is premium, and the prices | 001, 003, 005 |

The web app (Next.js, Prisma, SQLite, in-process CLIP/SlimSAM/Tesseract and Ollama) is retired as
these features land: 001 replaces the app shell, accounts, setup, plan and search logging; 003
replaces the photo, label and quick-bar pipelines.

## Store MVP (owner decision, 2026-10-15)

The first release is on the App Store (the owner tests on an iPhone through TestFlight); everything else ships in updates.

| In the MVP | Scope |
|---|---|
| 001 Mobile foundation | All of it (T060 device validation on the owner's iPhone included) |
| 002 part A | The sourced food list (≥ 450 foods, ≥ 80 dishes) and portion shortcuts |
| 003 AI logging | Photo and text-description logging through the one Gemini Edge Function; the on-device text preview when the model is down. Free with a per-user daily quota (start at 5 AI logs a day; the quota table and check are part of 003) |
| 005 Account and stores, store-required part | Apple Developer membership, account deletion (App Store guideline 5.1.1(v)), privacy policy and App Privacy details, store listing, EAS iOS build (cloud, no Mac needed), TestFlight, App Store review |
| Sign-in | E-mail, Google and Sign in with Apple (guideline 4.8 requires Apple when Google is offered) |

| After the MVP | Why |
|---|---|
| Android release | A few weeks after iOS: Google Play listing, Android emulator or device test of every flow |
| 002 parts B/C (barcode, own foods, saved meals) | Photo and text logging cover most of the need at launch |
| 004 Tracking (weight, water, fasting, trends) | Not core to calorie logging |
| 005 rest (data export) | Not required by the stores |
| 006 Subscription | Decided from usage data; until then the AI quota keeps Gemini cost bounded |

Order to the MVP: 002A → 003 → 005 (store part) → App Store release; 004 moves behind 003.
