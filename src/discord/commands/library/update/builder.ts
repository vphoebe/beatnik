import { SlashCommandBuilder } from "discord.js";

export const builder = new SlashCommandBuilder()
  .setName("update")
  .setDescription("Updated a saved library playlist.")
  .addIntegerOption((option) =>
    option
      .setName("playlist")
      .setDescription("Name of the playlist.")
      .setRequired(true)
      .setAutocomplete(true),
  );
