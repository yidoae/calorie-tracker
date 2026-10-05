-- AlterTable
ALTER TABLE "MealItem" ADD COLUMN "fiberPer100" REAL;
ALTER TABLE "MealItem" ADD COLUMN "satFatPer100" REAL;
ALTER TABLE "MealItem" ADD COLUMN "sodiumPer100" REAL;
ALTER TABLE "MealItem" ADD COLUMN "sugarPer100" REAL;

-- CreateTable
CREATE TABLE "WeightLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "kg" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WeightLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WaterLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "ml" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WaterLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SavedMeal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedMeal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FoodProduct" (
    "barcode" TEXT NOT NULL PRIMARY KEY,
    "data" TEXT,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Meal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "calories" INTEGER NOT NULL,
    "protein" REAL NOT NULL,
    "carbs" REAL NOT NULL,
    "fat" REAL NOT NULL,
    "imageUrl" TEXT,
    "slot" TEXT NOT NULL DEFAULT 'snack',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    CONSTRAINT "Meal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Meal" ("calories", "carbs", "createdAt", "fat", "id", "imageUrl", "name", "protein", "userId") SELECT "calories", "carbs", "createdAt", "fat", "id", "imageUrl", "name", "protein", "userId" FROM "Meal";
DROP TABLE "Meal";
ALTER TABLE "new_Meal" RENAME TO "Meal";
CREATE INDEX "Meal_createdAt_idx" ON "Meal"("createdAt");
CREATE INDEX "Meal_userId_createdAt_idx" ON "Meal"("userId", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "WeightLog_userId_day_key" ON "WeightLog"("userId", "day");

-- CreateIndex
CREATE INDEX "WaterLog_userId_createdAt_idx" ON "WaterLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SavedMeal_userId_idx" ON "SavedMeal"("userId");
