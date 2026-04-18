import { SlashCommandBuilder } from "discord.js";

export const builder = new SlashCommandBuilder()
  .setName("play")
  .setDescription("Play/queue a track from a URL or search term.")
  .addStringOption((option) =>
    option.setName("query").setDescription("A valid URL or search term to play.").setRequired(true),
  )
  .addBooleanOption((option) =>
    option
      .setName("end")
      .setDescription("Add to the end of the queue, instead of next.")
      .setRequired(false),
  )
  .addBooleanOption((option) =>
    option
      .setName("shuffle")
      .setDescription("Shuffle the playlist before adding to the queue.")
      .setRequired(false),
  );
