import { SlashCommandBuilder } from "discord.js";

export const builder = new SlashCommandBuilder()
  .setName("update")
  .setDescription("Updated a saved library playlist.")
  .addSubcommand((sc) =>
    sc
      .setName("playlist")
      .setDescription("Update a saved playlist.")
      .addIntegerOption((option) =>
        option
          .setName("playlist")
          .setDescription("The saved playlist.")
          .setRequired(true)
          .setAutocomplete(true),
      ),
  )
  .addSubcommand((sc) => sc.setName("all").setDescription("Update all saved playlists."));
