import Discord, { Guild } from "discord.js";
import { MemoryQueues } from "..";
import { PrismaClient } from "@prisma/client";
import changeTrack from "../transport/changeTrack";
import config from "../util/readConfig";

const prisma = new PrismaClient();

const removeFromQueue = async (message: Discord.Message, guildId: string, memoryQueues: MemoryQueues) => {
  const args = message.content.split(" ");
  const userQueueIndex = Number(args[1]);
  if (!userQueueIndex)
    return message.channel.send(`Please provide a number to delete from the queue. View the queue if you're not sure with ${config.prefix}q`);
  const queueIndex = userQueueIndex - 1; // adjust for user facing indxs
  const memoryQueue = memoryQueues.get(guildId);
  if (memoryQueue) {
    if (queueIndex === memoryQueue.currentIndex && memoryQueue.playing) {
      // if the deleted track is playing, skip it
      changeTrack(memoryQueue.textChannel, guildId, memoryQueues, "relative", 1);
    }
  }

  try {
    const removedTrack = await prisma.track.delete({
      where: {
        queue_id: {
          guildId,
          queueIndex,
        },
      },
    });

    // adjust indicies of tracks that were in front of it
    const adjustableTracks = await prisma.track.findMany({
      orderBy: [{ queueIndex: "asc" }],
      where: {
        queueIndex: {
          gt: queueIndex,
        },
      },
    });

    for (const adjTrack of adjustableTracks) {
      await prisma.track.update({
        where: {
          queue_id: {
            guildId: adjTrack.guildId,
            queueIndex: adjTrack.queueIndex,
          },
        },
        data: {
          queueIndex: {
            decrement: 1,
          },
        },
      });
    }
    return message.channel.send(`'${removedTrack.title}' removed from the queue.`);
  } catch (err) {
    console.log(err);
    return message.channel.send(`Track not found in the queue. View the queue if you're not sure with ${config.prefix}q`);
  } finally {
    await prisma.$disconnect();
  }
};

export default removeFromQueue;
