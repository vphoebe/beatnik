import Discord from "discord.js";
import { Queue } from "../types";
import getDurationString from "../util/duration";
import config from "../util/readConfig";

const prefix = config.prefix;

export function listQueue(message: Discord.Message, guildQueue: Queue) {
  if (!guildQueue) {
    return message.channel.send("No queue currently exists.");
  }
  if (guildQueue.songs.length > 1) {
    const queueItemStrings = guildQueue.songs.map((item, i) => {
      return `**[${i}]** ${item.title} (${getDurationString(
        item.length
      )})\n Queued by \`${item.user}\``;
    });

    const args = message.content.split(" ");
    const pageNumber = Number(args[1]) - 1 || 0;

    const pagedItems = queueItemStrings
      .slice(1)
      .slice(pageNumber * 10, pageNumber * 10 + 10);

    const queueEmbed = new Discord.MessageEmbed()
      .setColor("#ed872d")
      .setTitle("Now playing on beatnik")
      .setDescription(`**${queueItemStrings[0].replace("**[0]** ", "")}**`)
      .addField(
        `Up next (page ${pageNumber + 1} of ${Math.ceil(
          queueItemStrings.length / 10
        )})`,
        pagedItems.join("\n\n")
      )
      .addField("Change pages...", `${prefix}q [pagenumber]`)
      .setTimestamp()
      .setFooter("sent by beatnik");

    message.channel.send(queueEmbed);
  } else if (guildQueue.songs.length === 1) {
    message.channel.send("The current song is the last in the queue.");
  } else {
    message.channel.send("No songs currently in queue.");
  }
}
