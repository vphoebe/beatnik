import { updatePlaylistInLibrary } from "@/core/cache/operations";
import { playlists } from "@/core/db/playlist";
import type { AutocompleteHandler, CommandExecuter } from "@/discord/commands";

export const autocomplete: AutocompleteHandler = async (interaction) => {
  const focusedValue = interaction.options.getFocused();
  const savedPlaylists = playlists.all();
  const choices = savedPlaylists.map((sp) => ({
    name: sp.title,
    value: sp.int_id,
  }));
  await interaction.respond(
    choices
      .filter((c) => c.name.toLocaleUpperCase().includes(focusedValue.toLocaleUpperCase()))
      .slice(0, 25),
  );
};

export const execute: CommandExecuter = async (interaction) => {
  const guildId = interaction.guildId;
  if (!guildId) return;

  await interaction.deferReply();
  await interaction.editReply("Getting playlist...");
  const playlistIntId = interaction.options.getInteger("playlist", true);
  const update = await updatePlaylistInLibrary(playlistIntId);
  if (!update || !update.operation) {
    await interaction.editReply("Something went wrong.");
  } else {
    await interaction.editReply(`Updated "${update.playlistData.title}"!`);
  }
};
