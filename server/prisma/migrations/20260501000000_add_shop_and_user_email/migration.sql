-- AlterTable: add optional email to User
ALTER TABLE "User" ADD COLUMN "email" TEXT;

-- CreateTable: Shop
CREATE TABLE "Shop" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "phone2" TEXT,
    "email" TEXT,
    "gst" TEXT,
    "logo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
