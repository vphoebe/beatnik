/*
  Warnings:

  - You are about to drop the column `addedBy` on the `Track` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Track" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playlistId" TEXT,
    "title" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "length" INTEGER NOT NULL,
    "channelName" TEXT,
    "loudness" INTEGER NOT NULL,
    CONSTRAINT "Track_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Track" ("channelName", "id", "length", "loudness", "playlistId", "thumbnailUrl", "title") SELECT "channelName", "id", "length", "loudness", "playlistId", "thumbnailUrl", "title" FROM "Track";
DROP TABLE "Track";
ALTER TABLE "new_Track" RENAME TO "Track";
CREATE UNIQUE INDEX "Track_id_key" ON "Track"("id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
