import { SlashCommandBuilder } from "discord.js";

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
