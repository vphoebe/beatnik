/*
  Warnings:

  - You are about to drop the column `index` on the `Track` table. All the data in the column will be lost.
  - Added the required column `queueIndex` to the `Track` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "queue_id";

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Track" (
    "guildId" TEXT NOT NULL,
    "queueIndex" INTEGER NOT NULL,
    "service" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "user" TEXT NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,
    "lengthInSec" INTEGER NOT NULL
);
INSERT INTO "new_Track" ("guildId", "lengthInSec", "service", "thumbnailUrl", "title", "url", "user") SELECT "guildId", "lengthInSec", "service", "thumbnailUrl", "title", "url", "user" FROM "Track";
DROP TABLE "Track";
ALTER TABLE "new_Track" RENAME TO "Track";
CREATE UNIQUE INDEX "queue_id" ON "Track"("guildId", "queueIndex");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
