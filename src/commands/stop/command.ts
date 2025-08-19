import type { CommandExecuter } from "commands/index";
import { noQueueReply } from "discord/messaging";
import { getExistingQueue } from "discord/queue";

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
