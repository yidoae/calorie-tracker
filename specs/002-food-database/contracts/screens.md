# Contract: Screen changes (002 part A)

Only what changes from [001 screens](../../001-mobile-foundation/contracts/screens.md).

## `log/review` (Kontrol et)

Each draft item card (`DraftItemCard`) gains, under the gram field, when the food has unit portions:

- **Unit chips**, one per portion in source order: "adet", "dilim", "su bardağı", … Tapping a chip
  selects it with count 1 and writes its grams into the field (replacing what was typed).
- **Count stepper** for the selected chip: "−", the count, "+". The field shows unit grams × count.
  "−" is disabled at 1; "+" is disabled when the next count would pass 5000 g. Accessibility labels:
  "Bir azalt", "Bir artır"; the count is announced ("2 adet").
- **Typing** in the gram field clears the chip selection; the field stays the only saved value
  (001 FR-013).
- Foods without unit portions keep the 001 card: the "Tipik porsiyon yaklaşık … g" hint only.
- Touch targets ≥ 44 pt; lime is not used (the primary action stays "Kaydet").

Preview: the gallery (`tools/preview`) adds the card with chips and with a selected chip at count 2.

## `(tabs)/profile` (Profil)

Adds a "Veri kaynakları" section above "Çıkış yap" with the text of research §9 (FR-015).

## Unchanged

Search results (`FoodHitRow`) keep their layout; withdrawn foods simply no longer appear.
