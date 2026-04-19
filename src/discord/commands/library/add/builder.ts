import { SlashCommandBuilder } from "discord.js";

export const builder = new SlashCommandBuilder()
  .setName("add")
  .setDescription("Add a track or playlist to the library and download it for future playback.")
  .addStringOption((option) =>
    option
      .setName("query")
      .setDescription("Valid URL of track or playlist, or a search query to save the first result.")
      .setRequired(true),
  );
