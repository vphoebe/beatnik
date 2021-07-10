import Discord from "discord.js";
import { QueueConnections } from "..";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const clearQueue = async (channel: Discord.TextChannel, guildId: string, queueConnections: QueueConnections) => {
  const queueConnection = queueConnections.get(guildId);
  // leave voice channel if playing
  if (queueConnection?.voiceChannel) queueConnection.voiceChannel.leave();
  // delete memory queue
  queueConnections.delete(guildId);
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
