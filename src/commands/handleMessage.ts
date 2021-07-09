import Discord from "discord.js";
import { QueueConnections } from "..";
import config from "../util/readConfig";
import addToQueue from "./addToQueue";

const shortcuts = config.shortcuts;
const prefix = config.prefix;

const handleMessage = (message: Discord.Message, queueConnections: QueueConnections) => {
  // ignore unintended messages
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.split(" ");
  const command = args[0].substring(1);
  console.log(command);
  const detectedShortcut = shortcuts ? shortcuts.find((shortcut) => shortcut.shortcut === command) : null;

  if (detectedShortcut) {
    // replace content with full command
    message.content = `${prefix}${detectedShortcut.command}`;
  }

  switch (command) {
    case "p":
    case "play":
      // add to end of the queue
      addToQueue(message, queueConnections, "end");
      break;
    case "next":
      // add to next spot in queue
      break;
    case "delete":
      // remove an index from queue
      break;
    case "skip":
      // increment currentIndex in QueueConnection
      // skip current song
      break;
    case "back":
      // decrement currentIndex in QueueConnection
      // skip current song
      break;
    case "stop":
      // !playing in QueueConnection
      break;
    case "q":
    case "queue":
      // list queue
      break;
    case "vol":
    case "volume":
      // change volume
      break;
    case "h":
    case "help":
      // send help embed
      break;
    default:
      message.channel.send("Please enter a valid command.");
      break;
  }
};

export default handleMessage;

// export async function handleMessage(message: Discord.Message, globalQueues: GlobalQueues) {
//   if (message.author.bot) return;
//   if (!message.content.startsWith(prefix)) return;
//   if (message.guild === null) return;

//   const guildQueue = globalQueues.get(message.guild.id);

//   const args = message.content.split(" ");
//   const command = args[0].substring(1);
//   const detectedShortcut = shortcuts ? shortcuts.find((shortcut) => shortcut.shortcut === command) : null;

//   if (detectedShortcut) {
//     message.content = `${prefix}${detectedShortcut.command}`;
//   }

//   const isCommand = (query: string): boolean => {
//     return message.content.startsWith(`${prefix}${query}`);
//   };

//   if (isCommand("p")) {
//     queue(message, guildQueue, globalQueues);
//     return;
//   } else if (isCommand("skip")) {
//     skip(message, guildQueue);
//     return;
//   } else if (isCommand("stop")) {
//     stop(message, guildQueue);
//     return;
//   } else if (isCommand("q")) {
//     listQueue(message, guildQueue);
//     return;
//   } else if (isCommand("volume")) {
//     changeVolume(message, guildQueue);
//     return;
//   } else if (isCommand("h")) {
//     listCommands(message);
//     listShortcuts(message);
//     return;
//   } else {
//     message.channel.send("You need to enter a valid command!");
//     listCommands(message);
//     return;
//   }
// }
