-- CreateTable
CREATE TABLE "Track" (
    "guildId" TEXT NOT NULL,
    "queueIndex" INTEGER NOT NULL,
    "service" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "user" TEXT NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,
    "lengthInSec" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "queue_id" ON "Track"("guildId", "queueIndex");
