-- CreateTable
CREATE TABLE "Playlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorName" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Track" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playlistId" TEXT,
    "title" TEXT NOT NULL,
    "addedBy" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "length" INTEGER NOT NULL,
    "channelName" TEXT,
    "loudness" INTEGER NOT NULL,
    CONSTRAINT "Track_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
