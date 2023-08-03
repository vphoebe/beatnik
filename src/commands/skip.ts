import { Command, CommandExecuter } from "./index.js";
import { getExistingQueue } from "../lib/queue.js";
import { noQueueReply } from "../lib/replies.js";
import { SlashCommandBuilder } from "discord.js";

export const builder = new SlashCommandBuilder()
  .setName("skip")
  .setDescription("Skips the current song and plays the next track.")
  .addIntegerOption((option) =>
    option
      .setName("track")
      .setDescription(
        "Skip to a specific song in the queue by track number (seen in /queue command.)"
      )
      .setRequired(false)
  );

export const execute: CommandExecuter = async (interaction) => {
  const guildId = interaction.guildId;
  const skipIndex = interaction.options.getInteger("track", false);
  if (!guildId) return;
  const queue = await getExistingQueue(interaction);
  if (!queue) {
    await interaction.reply(noQueueReply);
    return;
  }
  if (skipIndex) {
    if (skipIndex - 1 < queue.tracks.length) {
      await queue.jump(skipIndex - 1);
    } else {
      await interaction.reply({
        content: "Invalid track number.",
        ephemeral: true,
      });
      return;
    }
  } else {
    await queue.next();
  }
  await interaction.reply({
    content: "Skipping this track!",
    ephemeral: true,
  });
};

export default { builder, execute, global: false } as Command;
