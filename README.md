# Kalori Takip

A Turkish calorie and macro tracker for iOS and Android, built with Expo on Supabase: sign up, a
short setup that builds your plan, meal logging by food search and grams, a plan wizard with live
tuning, and a calendar of past days.

## Setup

Prerequisites: Node 22+, npm, a Supabase project (URL + publishable key), and Expo Go or a
development build on a phone (Google and Apple sign-in need a development build).

```bash
npm install                                    # all workspaces
cp apps/mobile/.env.example apps/mobile/.env   # EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_KEY
npx supabase link --project-ref <ref>          # then apply supabase/migrations (see supabase/README.md)
npm run mobile                                 # Metro; scan the QR code
```

Full setup and the manual validation steps:
[specs/001-mobile-foundation/quickstart.md](specs/001-mobile-foundation/quickstart.md).

## Commands

```bash
npm test                                           # core and app unit/property tests
npm run typecheck && npm run lint && npm run knip  # types, layer rules, unused code
npm run preview                                    # screen gallery (tools/preview/dist/artifact.html)
maestro test .maestro/smoke.yaml                   # smoke flow on a device or emulator
```

Database migrations and pgTAP tests: [supabase/README.md](supabase/README.md).

## Where things are written down

- **Rules:** `.specify/memory/constitution.md`; features live in `specs/` (Spec Kit).
- **Architecture and conventions:** `CLAUDE.md`.
- **Design system:** `tofuhq-design/` and the tokens in `apps/mobile/src/theme.ts`.
