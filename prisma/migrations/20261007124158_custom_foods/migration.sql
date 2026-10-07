-- CreateTable
CREATE TABLE "CustomFood" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "kcalPer100" REAL NOT NULL,
    "proteinPer100" REAL NOT NULL,
    "carbsPer100" REAL NOT NULL,
    "fatPer100" REAL NOT NULL,
    "fiberPer100" REAL,
    "sugarPer100" REAL,
    "satFatPer100" REAL,
    "sodiumPer100" REAL,
    "servingGrams" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomFood_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CustomFood_userId_idx" ON "CustomFood"("userId");
