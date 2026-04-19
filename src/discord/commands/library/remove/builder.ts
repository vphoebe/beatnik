import { SlashCommandBuilder } from "discord.js";

export const builder = new SlashCommandBuilder()
  .setName("remove")
  .setDescription("Delete a track from the queue or a saved URL.")
  .addSubcommand((sc) =>
    sc
      .setName("queue")
      .setDescription("Delete a track from the queue.")
      .addIntegerOption((option) =>
        option
          .setName("track")
          .setDescription("Number of the track to remove from the queue.")
          .setRequired(true),
      ),
  )
  .addSubcommand((sc) =>
    sc
      .setName("playlist")
      .setDescription("Delete a playlist from the library.")
      .addIntegerOption((option) =>
        option
          .setName("playlist-name")
          .setDescription("Name of the playlist to delete.")
          .setRequired(true)
          .setAutocomplete(true),
      ),
  )
  .addSubcommand((sc) =>
    sc
      .setName("saved-track")
      .setDescription("Delete a saved track from the library.")
      .addIntegerOption((option) =>
        option
          .setName("track-name")
          .setDescription("Name of the track to delete.")
          .setRequired(true)
          .setAutocomplete(true),
      ),
  );
