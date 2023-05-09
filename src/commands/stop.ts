import { Command, CommandExecuter } from "./index.js";
import { getExistingQueue } from "../lib/queue.js";
import { noQueueReply } from "../lib/replies.js";
import { SlashCommandBuilder } from "@discordjs/builders";

export const builder = new SlashCommandBuilder()
  .setName("stop")
  .setDescription("Stop Beatnik playback and clear the queue.");

export const execute: CommandExecuter = async (interaction) => {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const queue = await getExistingQueue(interaction);
  if (!queue) {
    await interaction.reply(noQueueReply);
    return;
  }
  await queue.stop();
  await interaction.reply("Stopping and removing queue.");
};

export default { builder, execute, global: false } as Command;
