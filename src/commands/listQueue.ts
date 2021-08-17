import Discord from "discord.js";
import { MemoryQueues } from "..";
import { prisma } from "../lib/prisma";
import getDurationString from "../lib/duration";
import config from "../lib/readConfig";

const prefix = config.prefix;

const listQueue = async (message: Discord.Message, memoryQueues: MemoryQueues) => {
  if (message.guild === null) return;
  const memoryQueue = memoryQueues.get(message.guild.id);

  try {
    const dbQueue = await prisma.track.findMany({
      where: {
        guildId: message.guild.id,
      },
      orderBy: {
        queueIndex: "asc",
      },
    });

    if (dbQueue.length <= 0) {
      return message.channel.send("No queue currently exists.");
    }

    if (dbQueue.length > 0) {
      const queueItemStrings = dbQueue.map((track) => {
        return `**[#${track.queueIndex + 1}]** ${track.title} (${getDurationString(track.lengthInSec)})\n Queued by \`${track.user}\``;
      });
      const args = message.content.split(" ");
      const pageNumber = Number(args[1]) - 1 || 0;
      const pagedItems = queueItemStrings.slice(pageNumber * 10, pageNumber * 10 + 10);
      const totalPages = Math.ceil(queueItemStrings.length / 10);
      const nowPlayingIdx = memoryQueue?.currentIndex ?? 0;
      const currentlyPlaying = memoryQueue?.playing ?? false;

      if (pageNumber > totalPages - 1) return message.channel.send("Invalid queue page.");
      if (currentlyPlaying) {
        // if something is currently playing, send this first
        const nowPlayingEmbed = new Discord.MessageEmbed()
          .setColor("#ed872d")
          .setTitle("Now playing on beatnik")
          .setDescription(queueItemStrings[nowPlayingIdx])
          .setThumbnail(dbQueue[nowPlayingIdx].thumbnailUrl)
          .setTimestamp()
          .setFooter("sent by beatnik");
        message.channel.send(nowPlayingEmbed);
      }

      // send a list of the database queue
      const queueListEmbed = new Discord.MessageEmbed()
        .setColor("#ed872d")
        .setTitle(`Current queue`)
        .addField(`(Page ${pageNumber + 1} of ${totalPages})`, pagedItems.join("\n\n"))
        .addField("Change pages...", `${prefix}q [pagenumber]`)
        .setTimestamp()
        .setFooter("sent by beatnik");
      message.channel.send(queueListEmbed);
    }
  } catch (err) {
    console.log(err);
  } finally {
    await prisma.$disconnect();
  }
};

export default listQueue;
