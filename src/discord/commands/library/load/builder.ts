import { SlashCommandBuilder } from "discord.js";

export const builder = new SlashCommandBuilder()
  .setName("load")
  .setDescription("Load music from your library.")
  .addSubcommand((sc) =>
    sc
      .setName("playlist")
      .setDescription("Load a saved playlist.")
      .addIntegerOption((option) =>
        option
          .setName("playlist")
          .setDescription("The saved playlist.")
          .setRequired(true)
          .setAutocomplete(true),
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
      ),
  )
  .addSubcommand((sc) =>
    sc
      .setName("track")
      .setDescription("Load a saved track.")
      .addIntegerOption((option) =>
        option
          .setName("track")
          .setDescription("The saved track.")
          .setRequired(true)
          .setAutocomplete(true),
      ),
  );
