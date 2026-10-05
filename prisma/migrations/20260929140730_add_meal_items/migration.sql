-- CreateTable
CREATE TABLE "MealItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mealId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "grams" REAL NOT NULL,
    "kcalPer100" REAL NOT NULL,
    "proteinPer100" REAL NOT NULL,
    "carbsPer100" REAL NOT NULL,
    "fatPer100" REAL NOT NULL,
    CONSTRAINT "MealItem_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MealItem_mealId_idx" ON "MealItem"("mealId");
