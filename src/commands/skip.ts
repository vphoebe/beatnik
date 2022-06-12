import { Command, CommandExecuter } from ".";
import { Queue } from "../classes/Queue";
import { guildQueues } from "../lib/queue";
import { SlashCommandBuilder } from "@discordjs/builders";

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

  const existingQueue = guildQueues.has(guildId);
  let queue: Queue;
  if (existingQueue) {
    queue = guildQueues.get(guildId) as Queue;
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
  } else {
    await interaction.reply("Nothing is playing right now.");
  }
};

export default { builder, execute, global: false } as Command;
