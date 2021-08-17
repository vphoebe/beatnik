import Discord from "discord.js";
import { MemoryQueues } from "..";
import { prisma } from "../lib/prisma";

const clearQueue = async (channel: Discord.TextChannel, guildId: string, memoryQueues: MemoryQueues) => {
  const memoryQueue = memoryQueues.get(guildId);
  // leave voice channel if playing
  if (memoryQueue?.voiceChannel) memoryQueue.voiceChannel.leave();
  // delete memory queue
  memoryQueues.delete(guildId);
  try {
    const operation = await prisma.track.deleteMany({
      where: {
        guildId,
      },
    });
    return channel.send(`${operation.count} tracks removed from the queue.`);
  } catch (err) {
    console.log(err);
  } finally {
    await prisma.$disconnect();
  }
};

export default clearQueue;
