import Discord from "discord.js";
import { prefix, shortcuts } from "../../config.json";
import {
  execute,
  skip,
  stop,
  listQueue,
  changeVolume,
  listCommands,
  listShortcuts,
} from "../commands";
import { BotQueue } from "../types";

export async function handleMessage(
  message: Discord.Message,
  botQueue: BotQueue
) {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;
  if (message.guild === null) return;

  const serverQueue = botQueue.get(message.guild.id);

  const args = message.content.split(" ");
  const command = args[0].substring(1);
  const detectedShortcut = shortcuts.find(
    (shortcut) => shortcut.shortcut === command
  );

  if (detectedShortcut) {
    message.content = `${prefix}${detectedShortcut.command}`;
  }

  if (message.content.startsWith(`${prefix}p`)) {
    execute(message, serverQueue, botQueue);
    return;
  } else if (message.content.startsWith(`${prefix}skip`)) {
    skip(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}stop`)) {
    stop(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}q`)) {
    listQueue(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}volume`)) {
    changeVolume(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}help`)) {
    listCommands(message);
    listShortcuts(message);
    return;
  } else {
    message.channel.send("You need to enter a valid command!");
    listCommands(message);
    return;
  }
}
