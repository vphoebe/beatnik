import { AutocompleteHandler, Command, CommandExecuter } from "./index.js";
import { SlashCommandBuilder } from "discord.js";
import { addPlaylist } from "../lib/library/cache.js";
import { getPlaylists, getPlaylist } from "../lib/library/db.js";
import { getMetadataFromQuery } from "../lib/youtube/metadata.js";

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
  const playlistData = await getPlaylist(playlistIntId);
  if (!playlistData) {
    await interaction.editReply("Something went wrong.");
    return;
  }
  const queryResult = await getMetadataFromQuery(playlistData.url, false);
  const freshPlaylist = queryResult?.playlist;
  if (!freshPlaylist) {
    await interaction.editReply("Something went wrong.");
    return;
  }
  await interaction.editReply(
    `Playlist has ${freshPlaylist.tracks.length} tracks, updating and downloading...`,
  );
  await addPlaylist(freshPlaylist);
  await interaction.editReply(
    `Updated and downloaded "${freshPlaylist.title}"!`,
  );
};

export default { builder, execute, autocomplete, global: false } as Command;
