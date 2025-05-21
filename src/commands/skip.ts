import { MessageFlags, SlashCommandBuilder } from "discord.js";

import { getExistingQueue } from "lib/queue.js";
import { noQueueReply } from "lib/replies.js";

import { Command, CommandExecuter } from "./index.js";

export const builder = new SlashCommandBuilder()
  .setName("skip")
  .setDescription("Skips the current song and plays the next track.")
  .addIntegerOption((option) =>
    option
      .setName("track")
      .setDescription(
        "Skip to a specific song in the queue by track number (seen in /queue command.)",
      )
      .setRequired(false),
  );

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

export default { builder, execute } as Command;
