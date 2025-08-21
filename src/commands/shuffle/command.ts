import { MessageFlags } from "discord.js";

import type { CommandExecuter } from "@commands/index";

import { noQueueReply } from "@helpers/messaging";
import { getExistingQueue } from "@helpers/queue";

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
