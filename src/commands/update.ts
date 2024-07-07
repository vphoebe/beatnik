import { AutocompleteHandler, Command, CommandExecuter } from "./index.js";
import { SlashCommandBuilder } from "discord.js";
import { updatePlaylistInLibrary } from "../lib/library/index.js";
import { getPlaylists } from "../lib/library/db/playlist.js";

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

export const autocomplete: AutocompleteHandler = async (interaction) => {
  const focusedValue = interaction.options.getFocused();
  const savedPlaylists = await getPlaylists();
  const choices = savedPlaylists.map((sp) => ({
    name: sp.title,
    value: sp.int_id,
  }));
  await interaction.respond(
    choices
      .filter((c) =>
        c.name.toLocaleUpperCase().includes(focusedValue.toLocaleUpperCase()),
      )
      .slice(0, 25),
  );
};

export const execute: CommandExecuter = async (interaction) => {
  const guildId = interaction.guildId;
  if (!guildId) return;

  await interaction.deferReply();
  await interaction.editReply("Finding new playlist metadata...");
  const playlistIntId = interaction.options.getInteger("playlist", true);
  const update = await updatePlaylistInLibrary(playlistIntId);
  if (!update || !update.operation) {
    await interaction.editReply("Something went wrong.");
  } else {
    await interaction.editReply(`Updated "${update.playlistData.title}"!`);
  }
};

export default { builder, execute, autocomplete, global: false } as Command;
