/*
  Warnings:

  - Added the required column `title` to the `Playlist` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Playlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "authorName" TEXT NOT NULL
);
INSERT INTO "new_Playlist" ("authorName", "id", "url") SELECT "authorName", "id", "url" FROM "Playlist";
DROP TABLE "Playlist";
ALTER TABLE "new_Playlist" RENAME TO "Playlist";
CREATE UNIQUE INDEX "Playlist_id_key" ON "Playlist"("id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
