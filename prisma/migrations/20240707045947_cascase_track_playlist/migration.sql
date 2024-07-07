-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    CONSTRAINT "Track_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist" ("int_id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Track" ("channelName", "id", "int_id", "length", "loudness", "playlistId", "playlistIdx", "thumbnailUrl", "title", "url") SELECT "channelName", "id", "int_id", "length", "loudness", "playlistId", "playlistIdx", "thumbnailUrl", "title", "url" FROM "Track";
DROP TABLE "Track";
ALTER TABLE "new_Track" RENAME TO "Track";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
