import { MessageFlags, SlashCommandBuilder } from "discord.js";

import { getExistingQueue } from "../lib/queue.js";
import { noQueueReply } from "../lib/replies.js";
import { Command, CommandExecuter } from "./index.js";

export const builder = new SlashCommandBuilder()
  .setName("shuffle")
  .setDescription("Shuffles the queue after the current song.");

export const execute: CommandExecuter = async (interaction) => {
  const guildId = interaction.guildId;
  if (!guildId) return;
  const queue = await getExistingQueue(interaction);
  if (!queue) {
    await interaction.reply(noQueueReply);
    return;
  }
  queue.shuffle();
  await interaction.reply({
    content: "Shuffled the queue!",
    flags: MessageFlags.Ephemeral,
  });
};

export default { builder, execute } as Command;
