import { getSession } from "@/core/manager";
import { noQueueReply } from "@/discord/messaging";
import { MessageFlags } from "discord.js";

import type { CommandExecuter } from "..";

export const execute: CommandExecuter = async (interaction) => {
  const guildId = interaction.guildId;
  const skipIndex = interaction.options.getInteger("track", false);
  if (!guildId) return;
  const session = getSession(guildId);
  if (!session) {
    await interaction.reply(noQueueReply);
    return;
  }
  const { queue, player } = session;
  const currentSongTitle = queue?.nowPlaying?.title ?? "unknown";

  if (skipIndex) {
    if (skipIndex - 1 < queue.tracks.length) {
      player.jump(skipIndex - 1);
    } else {
      await interaction.reply({
        content: "Invalid track number.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
  } else {
    player.next();
  }
  await interaction.reply({
    content: `Skipping \`${currentSongTitle}\`...`,
    flags: MessageFlags.Ephemeral,
  });
};
