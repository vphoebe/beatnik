import Discord from "discord.js";
import config from "../lib/readConfig";

const prefix = config.prefix;

const commands: { command: string; desc: string }[] = [
  {
    command: "p",
    desc: "Play a URL of a video or playlist, or search a term and play the first result. Adds to the end of the queue if present. Use it by itself after to resume a queue if nothing is playing.",
  },
  {
    command: "p:shuffle",
    desc: "Shuffle a YouTube playlist url while adding to the queue.",
  },
  {
    command: "next",
    desc: "Add to the next spot in the queue, instead of the end.",
  },
  {
    command: "q",
    desc: "Displays the current queue. Use this to see a number for each queued track to use it for other commands.",
  },
  {
    command: "jump",
    desc: "Jump to a specific track using its queue number.",
  },
  {
    command: "delete",
    desc: "Delete a specific track using its queue number.",
  },
  {
    command: "skip",
    desc: "Skips to the next track in the queue.",
  },
  {
    command: "back",
    desc: "Play the previous track in the queue..",
  },
  {
    command: "stop",
    desc: "Stops playback, but maintains the queue for resume later. beatnik leaves the voice channel.",
  },
  {
    command: "clear",
    desc: "Stops playback and clears the current queue. beatnik leaves the voice channel.",
  },
  {
    command: "h",
    desc: "Shows this list of commands.",
  },
];

const listCommands = (message: Discord.Message) => {
  const commandEmbed = new Discord.MessageEmbed()
    .setColor("#ed872d")
    .setTitle("All commands")
    .setDescription(commands.map((cmd) => `\`${prefix}${cmd.command}\`: ${cmd.desc}`).join("\n\n"))
    .setTimestamp()
    .setFooter("sent by beatnik");
  message.channel.send(commandEmbed);
};

export default listCommands;
