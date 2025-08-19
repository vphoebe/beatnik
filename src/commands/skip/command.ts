import { MessageFlags } from "discord.js";
import type { CommandExecuter } from "commands/index";
import { noQueueReply } from "discord/messaging";
import { getExistingQueue } from "discord/queue";

export const execute: CommandExecuter = async (interaction) => {
  const guildId = interaction.guildId;
  const skipIndex = interaction.options.getInteger("track", false);
  if (!guildId) return;
  const queue = await getExistingQueue(interaction);
  const currentSongTitle = queue?.nowPlaying?.title ?? "unknown";
  if (!queue) {
    await interaction.reply(noQueueReply);
    return;
  }
  if (skipIndex) {
    if (skipIndex - 1 < queue.tracks.length) {
      queue.jump(skipIndex - 1);
    } else {
      await interaction.reply({
        content: "Invalid track number.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
  } else {
    queue.next();
  }
  await interaction.reply({
    content: `Skipping \`${currentSongTitle}\`...`,
    flags: MessageFlags.Ephemeral,
  });
};
