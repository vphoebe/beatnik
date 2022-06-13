import { Command, CommandExecuter } from ".";
import { getQueue } from "../lib/queue";
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

  try {
    const queue = await getQueue(interaction);
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
  } catch (err) {
    console.error(err);
    await interaction.reply(`Something went wrong! ${err}`);
  }
};

export default { builder, execute, global: false } as Command;
