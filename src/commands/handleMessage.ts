import Discord from "discord.js";
import {
  queue,
  skip,
  stop,
  listQueue,
  changeVolume,
  listCommands,
  listShortcuts,
} from "../commands";
import { GlobalQueues } from "../types";
import shortcuts from "../util/shortcuts";

const prefix = process.env.PREFIX;

export async function handleMessage(
  message: Discord.Message,
  globalQueues: GlobalQueues
) {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;
  if (message.guild === null) return;

  const guildQueue = globalQueues.get(message.guild.id);

  const args = message.content.split(" ");
  const command = args[0].substring(1);
  const detectedShortcut = shortcuts
    ? shortcuts.find((shortcut) => shortcut.shortcut === command)
    : null;

  if (detectedShortcut) {
    message.content = `${prefix}${detectedShortcut.command}`;
  }

  const isCommand = (query: string): boolean => {
    return message.content.startsWith(`${prefix}${query}`);
  };

  if (isCommand("p")) {
    queue(message, guildQueue, globalQueues);
    return;
  } else if (isCommand("skip")) {
    skip(message, guildQueue);
    return;
  } else if (isCommand("stop")) {
    stop(message, guildQueue);
    return;
  } else if (isCommand("q")) {
    listQueue(message, guildQueue);
    return;
  } else if (isCommand("volume")) {
    changeVolume(message, guildQueue);
    return;
  } else if (isCommand("h")) {
    listCommands(message);
    listShortcuts(message);
    return;
  } else {
    message.channel.send("You need to enter a valid command!");
    listCommands(message);
    return;
  }
}
