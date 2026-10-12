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
