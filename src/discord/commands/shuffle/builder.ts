import { SlashCommandBuilder } from "discord.js";

export const builder = new SlashCommandBuilder()
  .setName("shuffle")
  .setDescription("Shuffles the queue after the current song.");
