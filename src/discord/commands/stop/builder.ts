import { SlashCommandBuilder } from "discord.js";

export const builder = new SlashCommandBuilder()
  .setName("stop")
  .setDescription("Stop Beatnik playback and clear the queue.");
