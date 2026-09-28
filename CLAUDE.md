@AGENTS.md

# Calorie Tracker

Mobile-first web app that logs meals from food photos. The user snaps or uploads a photo, a Vision AI handler extracts name/calories/macros, and the dashboard shows daily progress bars plus a timeline of today's meals. Desktop is a 3-column layout (calendar · camera/progress/meals · profile & calculator); on phones the columns become tabs.

**Stack:** Next.js (App Router, TypeScript) · Tailwind CSS v4 · Lucide icons · Prisma 6 + SQLite.

> Next.js here is a newer version than most training data. Before changing framework-level code, read the matching guide in `node_modules/next/dist/docs/` (see AGENTS.md).

## Getting started

```bash
npm install                 # also runs `prisma generate` via postinstall
cp .env.example .env        # DATABASE_URL="file:./dev.db"
npm run db:migrate          # creates prisma/dev.db and applies migrations
npm run dev                 # http://localhost:3000
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve it |
| `npm run lint` | ESLint |
| `npm run typecheck` | `next typegen` + `tsc --noEmit` (route types like `RouteContext` are generated, so plain `tsc` fails on a clean checkout) |
| `npm run db:migrate` | `prisma migrate dev` — create/apply migrations after editing `schema.prisma` |
| `npm run db:deploy` | `prisma migrate deploy` — apply existing migrations (production) |
| `npm run db:studio` | Prisma Studio GUI |
| `npm run db:reset` | Drop and recreate the dev database |

## Project structure

```
prisma/
  schema.prisma            Meal model (id, name, calories, protein, carbs, fat, imageUrl, createdAt)
  migrations/              Committed migration history
  dev.db                   Local SQLite file (gitignored)
uploads/                   Stored meal photos (gitignored, created on first upload)
src/
  app/
    layout.tsx, page.tsx   Shell + home page (renders <Dashboard />)
    globals.css            Tailwind import, light/dark theme variables
    api/
      meals/route.ts       GET  list meals in a date range · POST  upload photo -> analyze -> save
      meals/[id]/route.ts  DELETE a meal (and its photo)
      uploads/[filename]/route.ts  GET  serves stored photos
      fitbot/chat/route.ts POST chat history -> local Ollama /api/chat -> { reply }
  components/
    Dashboard.tsx          Client component: 3-column layout (tabs below `lg`), loads today's meals, owns state, picks targets
    MealUploader.tsx       "Snap a meal" (inline live camera panel) + "Upload" buttons; POSTs FormData; shows no-food warning
    CameraCapture.tsx      getUserMedia video preview + reticle; "Capture & Analyze" grabs a frame via canvas
    ProfilePanel.tsx       Gender/height/weight/age/activity form (right column); Save persists the profile
    ProfileResults.tsx     BMI + WHO category badge/gauge, BMR/TDEE, suggested calories/protein/carbs/fat
    MealCalendar.tsx       Month grid (native, Monday-first, left column); selecting a day shows <DayDetail /> under it
    DayDetail.tsx          One day's totals vs targets + mini meal list with thumbnails
    MacroProgress.tsx      Accessible progress bar for one macro; turns red when over goal
    MealTimeline.tsx       List of meals (photo, time, macros, delete)
    MealThumb.tsx          Square meal photo with fallback icon
    FitBot.tsx             Floating bottom-right chat widget for the FitBot coach (state-only history)
    FitBotAvatar.tsx       Inline SVG robot-with-dumbbell avatar
  lib/
    fitbot.ts              ChatMessage type + FitBot system prompt (persona)
    fitbotContext.ts       Validates the widget's context; builds the "user's data" block (profile, targets, today's meals)
    targets.ts             resolveTargets: custom plan > profile > DAILY_GOALS (shared by Dashboard and FitBot)
    vision.ts              Vision AI handler (currently a mock): NoFoodError, analyzeFoodImage, output validation
    food/                  The mock's internals: imageFeatures.ts (sharp -> colour/texture stats),
                           recognize.ts (not-food guard + dish match/portion), catalog.ts (ingredients per 100 g, dishes)
    storage.ts             Save/read/delete uploaded images on disk; filename validation
    goals.ts               DAILY_GOALS fallback, MacroKey/Macros, sumMacros
    profile.ts             Profile type, BMI + WHO categories, Mifflin-St Jeor BMR/TDEE, calculateTargets, validation
    useProfile.ts          Profile persisted in localStorage via useSyncExternalStore
    useIsClient.ts         false on server/hydration, true after (avoids date/locale hydration mismatches)
    dates.ts               Local-timezone day keys and month grid helpers
    db.ts                  Prisma client singleton
    types.ts               MealDTO shared between API and client
```

## How it works

1. `MealUploader` POSTs the photo as multipart `image` to `/api/meals`. The photo comes from the live camera sheet (`CameraCapture`, JPEG from a canvas frame) or the file picker.
2. The route validates type (JPEG/PNG/WebP/GIF) and size (10 MB), calls `analyzeFoodImage()`, saves the file to `uploads/`, and inserts a `Meal`. It returns the new meal (201). If the photo isn't food, `analyzeFoodImage()` throws `NoFoodError` and the route answers 422 "No food detected in image. Please show a valid meal." — nothing is saved.
3. `Dashboard` prepends it to state; totals and progress bars recompute client-side.
4. On load, `Dashboard` calls `GET /api/meals?from=&to=` with the **browser's** local-day boundaries, so "today" follows the user's timezone rather than the server's.
5. `MealCalendar` uses the same endpoint for the visible month and groups meals by local day client-side; the selected day (today by default) is summarised under the grid. `Dashboard` bumps `refreshKey` after add/delete so the calendar refetches.

## Conventions and gotchas

- **Vision AI is a mock, driven by image statistics.** `analyzeFoodImage()` in `src/lib/vision.ts` decodes the photo with `sharp` (an explicit dependency; Next treats it as a server-external package), measures colour/texture/skin-tone stats, and (1) rejects non-food via `detectNoFood()` (too dark, flat/blank, a smooth skin-toned blob that doesn't reach the frame edge = person/face, mostly blue, only white/grey/black), else (2) matches the middle of the frame's colours to a dish in `food/catalog.ts` and derives weight and macros from per-100 g ingredient data, scaled by frame coverage plus per-image jitter. Same photo → same result; simulated latency 800 ms. These are heuristics, not a classifier — thresholds live in `GUARD` in `food/recognize.ts`, and wood tables, beige purées and unusual lighting can fool it. To use a real model, replace the body of `analyzeFoodImage` (keep throwing `NoFoodError` for non-food) and keep passing provider results through `normalize()`.
- **Photos are not in `public/`.** Files added to `public/` after build aren't reliably served in production, so photos go to `uploads/` and are served by `/api/uploads/[filename]`. Filenames must be server-generated UUIDs (`isValidFilename`) — this also blocks path traversal.
- **Daily targets come from the profile.** `Dashboard` uses `calculateTargets(profile)` (maintenance calories; protein 1.6 g/kg, fat 25% of kcal, carbs the remainder). The profile lives in browser `localStorage` (not the DB), so it is per-device; until it's set, `DAILY_GOALS` in `src/lib/goals.ts` is the fallback.
- **Live camera needs a secure context** (https or localhost). Otherwise `navigator.mediaDevices` is undefined and "Snap a meal" falls back to the hidden `capture` file input, which opens the native camera app on phones. To test the live camera on a phone, run `npm run dev:https` and open `https://<LAN-IP>:3000` (accept the self-signed cert warning). LAN origins are whitelisted in `allowedDevOrigins` (`next.config.ts`); without that, Next blocks the dev bundles for them and the page never hydrates. Large/HEIC picks are re-encoded to a ≤1600 px JPEG client-side (`preparePhoto` in `MealUploader`).
- **The live camera is inline, not a modal.** `MealUploader` renders `CameraCapture` in a panel under the buttons; unmounting it (close button or capture) is what releases the camera stream.
- **Responsive layout is CSS-only.** `Dashboard` renders all three columns and hides the inactive ones below `lg` with `hidden lg:block`; the tab state only matters on phones. `ProfilePanel` is keyed on the saved profile so it remounts with fresh values when the profile changes.
- **FitBot needs a local Ollama server.** `/api/fitbot/chat` calls `${LOCAL_LLM_URL}/api/chat` (default `http://localhost:11434`) with `LOCAL_LLM_MODEL` (default `llama3.2`), non-streaming, 120 s timeout, last 20 messages. It answers 503 when Ollama isn't running and 502 with an `ollama pull` hint when the model is missing; the widget shows these instead of crashing. The persona lives in `FITBOT_SYSTEM_PROMPT` (`src/lib/fitbot.ts`).
- **FitBot sees the user's data.** The widget sends the active profile, custom plan, local-day bounds and timezone as `context`; the route re-validates them (`parseProfile`/`parseCustomPlan`), reads today's meals from the DB and appends `buildUserContext()` to the system prompt. All numbers (targets, eaten, remaining) are precomputed there on purpose — small models get arithmetic wrong, so always give them the final figures. If the DB read fails the block is omitted rather than claiming nothing was eaten.
- **Prisma is pinned to v6.** `prisma@latest` on npm is currently a v8 release candidate; v7+ changes client generation and config, so don't bump without migrating.
- `DATABASE_URL` for SQLite is relative to `prisma/schema.prisma`, so `file:./dev.db` means `prisma/dev.db`.
- Route Handlers receive `params` as a Promise: `const { id } = await ctx.params` (typed via the global `RouteContext<"/route/[param]">`).
