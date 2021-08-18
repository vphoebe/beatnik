-- DropIndex
DROP INDEX "queue_id";

-- AlterTable
ALTER TABLE "Track" ADD PRIMARY KEY ("guildId", "queueIndex");
