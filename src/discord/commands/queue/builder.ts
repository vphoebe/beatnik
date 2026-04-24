import { SlashCommandBuilder } from "discord.js";

export const builder = new SlashCommandBuilder()
  .setName("queue")
  .setDescription("View the current queue.")
  .addIntegerOption((option) =>
    option
      .setName("page")
      .setDescription("Specify the page number of the queue to view")
      .setRequired(false),
  );
