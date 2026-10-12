# Contract: Screens and Navigation (expo-router)

Routes live in `apps/mobile/src/app/`. The root layout reads the auth session and the profile and
redirects; no screen decides access on its own.

| Route | Screen (Turkish title) | Who | Story / FR |
|---|---|---|---|
| `(auth)/welcome` | Hoş geldin: what the app does; "Apple ile devam et", "Google ile devam et", "E-postayla devam et" | signed out | US1, FR-001 |
| `(auth)/sign-in` | Giriş yap (e-posta) + "Şifremi unuttum" | signed out | US1, FR-001, FR-003 |
| `(auth)/sign-up` | Hesap oluştur (e-posta), then "E-postanı doğrula" | signed out | US1, FR-002 |
| `(auth)/reset-password` | Yeni şifre (opened from the e-mail deep link) | link holder | US1, FR-003 |
| `(setup)/[step]` | İlk kurulum, steps: cinsiyet ve yaş → boy ve kilo → hedef kilo → hareket → beslenme tarzı → özet | signed in, setup not complete | US2, FR-006, FR-007 |
| `(tabs)/index` | Bugün: calorie ring, macro bars, meals by slot, add button | set up | US3, FR-018 |
| `(tabs)/history` | Geçmiş: month calendar with on-target marks | set up | US5, FR-019 |
| `(tabs)/plan` | Planım: active plan, "Planı düzenle", "Yeni plan" | set up | US4 |
| `(tabs)/profile` | Profil: account, sign out | set up | US1, FR-005 |
| `log/search` | Yemek ara (modal) | set up | US3, FR-012 |
| `log/review` | Kontrol et: gram field (empty), slot, live totals, Kaydet | set up | US3, FR-013, FR-014 |
| `meal/[id]` | Öğün: items with grams, edit, remove, delete meal | set up, own meal | US3, FR-017 |
| `day/[date]` | A past day: meals and totals vs that day's targets | set up | US5, FR-019 |
| `plan/wizard` | Plan sihirbazı, 4 steps + live preview | set up | US4, FR-009, FR-010 |
| `plan/review` | İnce ayar: calorie and macro sliders, "Kalori sabit", Aktif planım yap | set up | US4, FR-009, FR-011 |

Redirect rules (root layout):
1. No session → `(auth)/welcome`.
2. Session, e-mail sign-up not confirmed → the "E-postanı doğrula" state of `(auth)/sign-up`.
3. Session, `onboarding_completed = false` → `(setup)/[first unanswered step]` (FR-006 resume).
4. Otherwise → `(tabs)/index`.

Deep links: scheme `kaloritakip://` for e-mail confirmation and password reset; universal/app links
are added with the store work in 005.
