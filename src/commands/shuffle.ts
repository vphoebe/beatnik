import { Command, CommandExecuter } from './index.js';
import { getExistingQueue } from '../lib/queue.js';
import { noQueueReply } from '../lib/replies.js';
import { SlashCommandBuilder } from "@discordjs/builders";

export const builder = new SlashCommandBuilder()
  .setName("shuffle")
  .setDescription(
    "Shuffles the current queue and starts playback from the top."
  );

export const execute: CommandExecuter = async (interaction) => {
  const guildId = interaction.guildId;
  if (!guildId) return;
  const queue = await getExistingQueue(interaction);
  if (!queue) {
    await interaction.reply(noQueueReply);
    return;
  }
  await queue.shuffle();
  await interaction.reply({
    content: "Shuffled the queue!",
    ephemeral: true,
  });
};

export default { builder, execute, global: false } as Command;
