import { MessageFlags } from "discord.js";

import type { CommandExecuter } from "..";
import { getSession } from "../../../core/manager";
import { noQueueReply } from "../../messaging";

export const execute: CommandExecuter = async (interaction) => {
  const guildId = interaction.guildId;
  if (!guildId) return;
  const session = getSession(guildId);
  if (!session) {
    await interaction.reply(noQueueReply);
    return;
  }
  session.queue.shuffle();
  await interaction.reply({
    content: "Shuffled the queue!",
    flags: MessageFlags.Ephemeral,
  });
};
