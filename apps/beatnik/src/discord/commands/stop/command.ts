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

  await session.player.stop();
  await interaction.reply("Stopping and removing queue.");
};
