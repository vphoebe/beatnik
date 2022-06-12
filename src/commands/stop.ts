import { Command, CommandExecuter } from ".";
import { Queue } from "../classes/Queue";
import { guildQueues } from "../lib/queue";
import { SlashCommandBuilder } from "@discordjs/builders";

export const builder = new SlashCommandBuilder()
  .setName("stop")
  .setDescription("Stop beatnik playback and clear the queue.");

export const execute: CommandExecuter = async (interaction) => {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const existingQueue = guildQueues.has(guildId);
  let queue: Queue;
  if (existingQueue) {
    queue = guildQueues.get(guildId) as Queue;
    queue.stop();
    await interaction.reply("Stopping and removing queue.");
  } else {
    await interaction.reply("Nothing is playing right now.");
  }
};

export default { builder, execute, global: false } as Command;
