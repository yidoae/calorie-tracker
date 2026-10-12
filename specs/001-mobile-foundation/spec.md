# Feature Specification: Mobile Foundation

**Feature Branch**: `001-mobile-foundation`

**Created**: 2026-10-09

**Status**: Draft

**Input**: User description: "Calorie Tracker becomes a native iOS and Android app instead of a web
app. No website at all. Accounts with e-mail, Apple and Google. First slice: an account, the
first-time setup that produces personal daily targets, the plan wizard, and logging a meal by
searching a food and typing the grams, shown on a daily dashboard. Reference app: Calyra."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create an account and stay signed in (Priority: P1)

A new user installs the app and creates an account with their e-mail and a password, with Google,
or on iPhone with Sign in with Apple. Next time they open the app they are still signed in. They can sign out,
and if they forget their password they can reset it by e-mail.

**Why this priority**: Every other feature stores personal data; nothing works without an account.

**Independent Test**: Install the app on a clean device, create an account with each sign-in method
offered on that platform, close and reopen the app, sign out, and reset a password; each step works
on iOS and Android.

**Acceptance Scenarios**:

1. **Given** a fresh install, **When** the user signs up with e-mail and a valid password and
   confirms the e-mail, **Then** they are signed in and land on the first-time setup.
2. **Given** a fresh install on iOS, **When** the user taps "Apple ile devam et" and approves,
   **Then** an account is created (even if they hide their e-mail) and they land on the setup.
3. **Given** a signed-in user, **When** they close the app and reopen it a week later, **Then** they
   are still signed in without typing anything.
4. **Given** a user who forgot their password, **When** they request a reset, **Then** they receive
   an e-mail and can set a new password from it.
5. **Given** a signed-in user, **When** they sign out, **Then** the app returns to the welcome
   screen and no personal data remains visible.

---

### User Story 2 - First-time setup gives personal daily targets (Priority: P1)

Right after signing up, the user answers a short setup: sex, age, height, current weight, goal
weight, activity level and diet style. The app computes a plan and shows today's calorie, protein,
carbohydrate and fat targets on the dashboard.

**Why this priority**: Targets are what makes logging meaningful; Calyra and every comparable app
start here.

**Independent Test**: Complete the setup with known answers and compare the dashboard targets with
the nutrition engine's expected output for those answers.

**Acceptance Scenarios**:

1. **Given** a new account, **When** the user completes all setup steps, **Then** the dashboard
   shows calorie and macro targets that match the nutrition engine for those answers.
2. **Given** a user who closes the app halfway through setup, **When** they reopen it, **Then** the
   setup resumes and the dashboard stays unavailable until it is finished.
3. **Given** an answer outside the accepted range (e.g. height 300 cm), **When** the user tries to
   continue, **Then** the field is highlighted with a Turkish explanation and they cannot continue.
4. **Given** any answers, **When** the plan is computed, **Then** no day's calorie target is below
   the safe floor for the user's sex.

---

### User Story 3 - Log a meal by searching a food (Priority: P1)

From the dashboard the user taps the add button, searches for a food in Turkish ("tavuk göğsü"),
picks it, types how many grams they ate, chooses the meal (breakfast, lunch, dinner, snack) and
saves. The dashboard ring and today's meal list update immediately. They can edit the grams or
delete the meal later.

**Why this priority**: Logging is the core loop. Search is the one logging path that needs no AI,
so it is the right first path; photo, barcode and text description build on the same review step.

**Independent Test**: Log three foods into two meals, edit one amount, delete one meal, and check
that the totals on the dashboard always equal the sum of the remaining items.

**Acceptance Scenarios**:

1. **Given** a set-up user, **When** they search "tavuk", **Then** matching foods appear as they
   type, including Turkish spellings and common suffixes ("tavuğu").
2. **Given** a chosen food, **When** the review step opens, **Then** the gram field is empty and
   must be filled before saving; calories and macros update live as they type.
3. **Given** a saved meal, **When** the user returns to the dashboard, **Then** the calorie ring and
   macro bars include the meal and the meal appears under its slot.
4. **Given** a saved meal, **When** the user changes its grams or deletes it, **Then** the
   dashboard totals change accordingly.
5. **Given** no network, **When** the user tries to save, **Then** the app says the meal could not
   be saved and keeps what they entered so they can retry.

---

### User Story 4 - Build and fine-tune a plan in the wizard (Priority: P2)

The user opens the plan wizard and answers four steps (body and goal with a deficit or surplus,
training style and days, diet style and meal pattern, calorie cycling). A live preview shows the
result while they answer. On the last step they see the plan, adjust calories and macros with
sliders, and make it their active plan.

**Why this priority**: The setup already gives a sensible plan; the wizard gives control to users
who train or diet seriously.

**Independent Test**: Create a plan with cycling on, adjust protein with the calorie lock on, save,
and check that the dashboard shows the training-day or rest-day targets for today.

**Acceptance Scenarios**:

1. **Given** the wizard, **When** the user changes an answer, **Then** the preview updates at once.
2. **Given** the wizard, **When** the user selects 16:8 fasting or a deficit of 750 kcal or more,
   **Then** a sensitive-content notice is shown once, right at the selection, with a gentler option.
3. **Given** a plan with calorie cycling, **When** today is a training day, **Then** the dashboard
   shows the training-day targets and labels the day.
4. **Given** the tuning step, **When** the user moves one macro with "Kalori sabit" on, **Then** the
   other macros rebalance so total calories stay the same.

---

### User Story 5 - Look back at previous days (Priority: P3)

The user opens a calendar, sees which days were on target, and opens any past day to see its meals
and totals against that day's targets.

**Why this priority**: Useful from the first week, but the app is complete without it on day one.

**Independent Test**: Log meals on three different days and confirm the calendar marks and the
day details match the logged data.

**Acceptance Scenarios**:

1. **Given** logged days, **When** the user opens the calendar, **Then** each logged day shows
   whether it was within ±5 % of its own target; days without meals show nothing.
2. **Given** a past day, **When** the user opens it, **Then** its meals, totals and that day's
   targets are shown.

---

### Edge Cases

- The same person signs in with Google and later with e-mail using the same verified address: they
  reach the same account, not a second one.
- Sign in with Apple with "Hide My Email": the account works normally with the relay address.
- The app stays open across midnight: the dashboard switches to the new day without a restart.
- The user travels to another time zone: meals keep the local date they were logged on.
- A gram amount of 0, a negative number or more than 5,000 g is rejected with an explanation.
- The session expires or is revoked on another device: the user is sent to sign in again with a
  clear message, and unsaved input on the current screen is not silently lost.
- A user tries to read or change another user's meal (e.g. a tampered request): it is refused and
  nothing about that meal is revealed.
- The food search finds nothing: the user sees an empty state, not an error.

## Requirements *(mandatory)*

### Functional Requirements

**Accounts**

- **FR-001**: Users MUST be able to create an account and sign in with e-mail and password and with
  Google on iOS and Android, and with Sign in with Apple on iOS.
- **FR-002**: E-mail sign-ups MUST confirm the address before the account can be used.
- **FR-003**: Users MUST be able to reset a forgotten password by e-mail.
- **FR-004**: The app MUST keep users signed in across restarts until they sign out, and MUST store
  session credentials only in the device's secure storage.
- **FR-005**: Signing out MUST remove all personal data from the screen and local caches.

**Setup and plan**

- **FR-006**: A new account MUST complete the first-time setup before reaching the dashboard; an
  interrupted setup MUST resume where it stopped.
- **FR-007**: The setup MUST collect sex, age, height, current weight, goal weight, activity level
  and diet style, within the accepted ranges (height 100–250 cm, weight 30–300 kg, age 15–100).
- **FR-008**: The system MUST compute the plan with the single nutrition engine, and every day's
  calorie target MUST be at or above 1,200 kcal for women and 1,500 kcal for men.
- **FR-009**: Users MUST be able to build a plan in a four-step wizard with a live preview, tune
  calories and macros, and make it their active plan.
- **FR-010**: Choosing 16:8 fasting or a deficit of 750 kcal or more MUST first show a
  sensitive-content notice with a gentler alternative; the acknowledgement is remembered.
- **FR-011**: When the plan cycles calories, the dashboard MUST use the training-day or rest-day
  targets for the current weekday.

**Logging**

- **FR-012**: Users MUST be able to search the food database in Turkish, tolerant of case, Turkish
  characters and common suffixes, with results appearing while typing.
- **FR-013**: Every food logged MUST go through a review step where the user types the grams; the
  gram field starts empty and only accepts more than 0 and at most 5,000 g.
- **FR-014**: Each meal MUST belong to a slot (breakfast, lunch, dinner, snack); the slot defaults
  from the time of day and can be changed.
- **FR-015**: Meal totals MUST be computed by the system from the meal's items; values sent by the
  app are never trusted.
- **FR-016**: Each meal MUST store the local date and time zone it was logged in; days are grouped
  by that local date.
- **FR-017**: Users MUST be able to change the grams of an item, remove an item, and delete a meal.

**Dashboard and history**

- **FR-018**: The dashboard MUST show today's calorie ring, macro progress and today's meals by slot,
  and MUST switch to the new day at local midnight while the app is open.
- **FR-019**: Users MUST be able to open a calendar of past days marked "on target" (within ±5 % of
  that day's own calorie target) and see any day's meals and totals.

**Platform, language and security**

- **FR-020**: All user-facing text MUST be Turkish and use "sen" consistently.
- **FR-021**: Users MUST only ever be able to read or change their own data; any other attempt MUST
  fail without revealing whether the data exists.
- **FR-022**: Every action that waits on the network MUST show progress and end with a success or
  a Turkish error message that says what to do next.

### Key Entities

- **Account**: a person who uses the app; has one or more sign-in methods (e-mail, Apple, Google)
  that lead to the same account when the verified e-mail matches.
- **Profile**: the account's body data and preferences: sex, birth year or age, height, weight,
  goal weight, activity level, diet style, time zone, and whether the setup is complete.
- **Nutrition plan**: the active plan: the wizard answers, basal and total energy expenditure, the
  daily targets, training-day and rest-day targets when cycling, and a short summary.
- **Food**: an entry in the shared food database: Turkish name, aliases, nutrition per 100 g,
  typical portion and unit weights.
- **Meal**: something eaten at one time: slot, local date, time zone, name, and totals computed from
  its items.
- **Meal item**: one food in a meal: the food, the grams eaten, and the nutrition per 100 g as it was
  when logged.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user goes from opening the app for the first time to seeing their daily targets
  in under 3 minutes.
- **SC-002**: Logging a searched food takes at most 5 taps plus typing the search and the grams,
  and under 20 seconds for a returning user.
- **SC-003**: After a meal is saved, the dashboard shows the new totals within 1 second.
- **SC-004**: The app opens to a usable dashboard within 3 seconds on a mid-range phone from 2023.
- **SC-005**: In automated tests, no user can read or change another user's profile, plan, meals
  or meal items (0 leaks).
- **SC-006**: For every combination of setup answers in the property tests, every day's calorie
  target is at or above the floor and the macros add up to the calories within rounding.
- **SC-007**: Every sign-in method works on its platforms: e-mail and Google on an iOS and an
  Android test device, Apple on an iOS test device.

## Assumptions

- Sign in with Apple is offered on iOS only: Apple's rule that requires it applies to the App Store,
  and on Android it would need a browser flow and a secret renewed every six months. Android users
  sign in with e-mail or Google.
- There is no guest mode: the app needs an account before any screen with personal data (as in
  Calyra). The welcome screen may show what the app does.
- Turkish only and metric units only for this release.
- The food database for this slice is the existing curated set (about 80 foods, per 100 g, with
  Turkish aliases), moved into the database; the full database (TürKomp, USDA, Open Food Facts,
  barcodes, own foods) is feature 002.
- Photo recognition, label reading and text description (feature 003) and weight, water, fasting,
  trends and plan periods (feature 004) build on the review step and data model defined here.
- Data export, account deletion, store listings and the privacy policy page required by the stores
  are feature 005. There is no website, so where the privacy policy is published is decided there.
- There is no production data to migrate; the web app, its accounts and its data are retired.
- Users have a network connection while logging; offline logging is a later improvement.
- Minimum iOS and Android versions follow the current defaults of the chosen app platform.
