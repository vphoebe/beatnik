import Discord from "discord.js";
import { Queue } from "../types";
import { prefix } from "../config.json";

export function listQueue(message: Discord.Message, serverQueue: Queue) {
  if (!serverQueue) {
    return message.channel.send("No queue currently exists.");
  }
  if (serverQueue.songs.length > 0) {
    const queueItemStrings = serverQueue.songs.map((item, i) => {
      return `**[${i}]** ${item.title}\n Queued by \`${item.user}\``;
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
  } else {
    message.channel.send("No songs currently in queue.");
  }
}
