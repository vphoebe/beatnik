import Discord from "discord.js";
import { MemoryQueues } from "..";
import changeTrack from "../transport/changeTrack";
import playNextTrack from "../transport/playNextTrack";
import stopPlayback from "../transport/stopPlayback";
import config from "../util/readConfig";
import addToQueue from "./addToQueue";
import clearQueue from "./clearQueue";
import listCommands from "./listCommands";
import listQueue from "./listQueue";
import removeFromQueue from "./removeFromQueue";

const shortcuts = config.shortcuts;
const prefix = config.prefix;

const handleMessage = (message: Discord.Message, memoryQueues: MemoryQueues) => {
  // ignore unintended messages
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;
  if (!message.guild) return;
  if (!message.member) return;
  const voiceChannel = message.member.voice.channel;

  if (!voiceChannel) {
    return message.channel.send(`${message.member.user.username}, you need to join a voice channel before controlling the music.`);
  }

  const guildId = message.guild.id;
  const args = message.content.split(" ");
  let command = args[0].substring(1);
  const detectedShortcut = shortcuts ? shortcuts.find((shortcut) => shortcut.shortcut === command) : null;

  if (detectedShortcut) {
    // replace content with full command
    command = detectedShortcut.command.split(" ")[0];
    message.content = `${prefix}${detectedShortcut.command}`;
  }

  switch (command) {
    case "p":
    case "play":
    case "p:shuffle":
      // add to end of the queue or resume
      const args = message.content.split(" ");
      const url = args[1];
      if (!url) {
        // resume playback
        playNextTrack(guildId, memoryQueues, message.channel as Discord.TextChannel, voiceChannel);
      } else {
        addToQueue(message, memoryQueues, "end");
      }
      break;
    case "next":
      // add to next spot in queue
      addToQueue(message, memoryQueues, "next");
      break;
    case "delete":
      // remove an index from queue
      removeFromQueue(message, guildId, memoryQueues);
      break;
    case "skip":
      // increment currentIndex in MemoryQueue
      changeTrack(message.channel as Discord.TextChannel, guildId, memoryQueues, 1);
      break;
    case "back":
      // decrement currentIndex in MemoryQueue
      changeTrack(message.channel as Discord.TextChannel, guildId, memoryQueues, -1);
      break;
    case "stop":
      // leave voice channel but keep position in queue
      stopPlayback(message.channel as Discord.TextChannel, guildId, memoryQueues);
      break;
    case "clear":
      // clear queue for this guild
      clearQueue(message.channel as Discord.TextChannel, guildId, memoryQueues);
      break;
    case "q":
    case "queue":
      // list queue
      listQueue(message, memoryQueues);
      break;
    case "h":
    case "help":
      // send help embed
      listCommands(message);
      break;
    default:
      message.channel.send("Please enter a valid command.");
      break;
  }
};

export default handleMessage;
