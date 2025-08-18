import { MessageFlags } from "discord.js";

import { getExistingQueue } from "lib/queue";
import { noQueueReply } from "lib/replies";

import { CommandExecuter } from "..";

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
