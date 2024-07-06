/*
  Warnings:

  - The primary key for the `Playlist` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Track` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `playlistId` on the `Track` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - Added the required column `int_id` to the `Playlist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `int_id` to the `Track` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Playlist" (
    "int_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "lastUpdated" DATETIME NOT NULL
);
INSERT INTO "new_Playlist" ("authorName", "id", "lastUpdated", "title", "url") SELECT "authorName", "id", "lastUpdated", "title", "url" FROM "Playlist";
DROP TABLE "Playlist";
ALTER TABLE "new_Playlist" RENAME TO "Playlist";
CREATE TABLE "new_Track" (
    "int_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "playlistId" INTEGER,
    "playlistIdx" INTEGER,
    "title" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "length" INTEGER NOT NULL,
    "channelName" TEXT,
    "loudness" INTEGER,
    CONSTRAINT "Track_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist" ("int_id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Track" ("channelName", "id", "length", "loudness", "playlistId", "thumbnailUrl", "title", "url") SELECT "channelName", "id", "length", "loudness", "playlistId", "thumbnailUrl", "title", "url" FROM "Track";
DROP TABLE "Track";
ALTER TABLE "new_Track" RENAME TO "Track";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
