/*
  Warnings:

  - Made the column `channelName` on table `Track` required. This step will fail if there are existing NULL values in that column.
  - Made the column `loudness` on table `Track` required. This step will fail if there are existing NULL values in that column.
  - Made the column `thumbnailUrl` on table `Track` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Track" (
    "int_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,
    "length" INTEGER NOT NULL,
    "channelName" TEXT NOT NULL,
    "loudness" INTEGER NOT NULL,
    "playlistId" INTEGER,
    "playlistIdx" INTEGER,
    CONSTRAINT "Track_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist" ("int_id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Track" ("channelName", "id", "int_id", "length", "loudness", "playlistId", "playlistIdx", "thumbnailUrl", "title", "url") SELECT "channelName", "id", "int_id", "length", "loudness", "playlistId", "playlistIdx", "thumbnailUrl", "title", "url" FROM "Track";
DROP TABLE "Track";
ALTER TABLE "new_Track" RENAME TO "Track";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
