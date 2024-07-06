/*
  Warnings:

  - Added the required column `url` to the `Playlist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url` to the `Track` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Playlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "authorName" TEXT NOT NULL
);
INSERT INTO "new_Playlist" ("authorName", "id") SELECT "authorName", "id" FROM "Playlist";
DROP TABLE "Playlist";
ALTER TABLE "new_Playlist" RENAME TO "Playlist";
CREATE UNIQUE INDEX "Playlist_id_key" ON "Playlist"("id");
CREATE TABLE "new_Track" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "playlistId" TEXT,
    "title" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "length" INTEGER NOT NULL,
    "channelName" TEXT,
    "loudness" INTEGER,
    CONSTRAINT "Track_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Track" ("channelName", "id", "length", "loudness", "playlistId", "thumbnailUrl", "title") SELECT "channelName", "id", "length", "loudness", "playlistId", "thumbnailUrl", "title" FROM "Track";
DROP TABLE "Track";
ALTER TABLE "new_Track" RENAME TO "Track";
CREATE UNIQUE INDEX "Track_id_key" ON "Track"("id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
