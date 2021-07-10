import Discord from "discord.js";
import config from "../util/readConfig";

const prefix = config.prefix;

const listCommands = (message: Discord.Message) => {
  const commandEmbed = new Discord.MessageEmbed()
    .setColor("#ed872d")
    .setTitle("All commands")
    .setDescription(
      `\`${prefix}p\`: Play a URL of a video or playlist, or search a term and play the first result. Adds to the end of the queue if present. Use it with nothing after to resume a queue if nothing is playing.\n
      \`${prefix}p:shuffle\`: Shuffle a playlist while adding to the queue.\n
    \`${prefix}q\`: List the queue, including the currently playing item.\n
    \`${prefix}skip\`: Skips to the next item in queue.\n
    \`${prefix}stop\`: Stops and disconnects from the voice channel.\n
    \`${prefix}help\`: Show this message.`
    )
    .setTimestamp()
    .setFooter("sent by beatnik");
  message.channel.send(commandEmbed);
};

export default listCommands;
