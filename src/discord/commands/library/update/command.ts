import { updatePlaylistInLibrary } from "@/core/cache/operations";
import { playlists } from "@/core/db/playlist";
import type { AutocompleteHandler, CommandExecuter } from "@/discord/commands";
import type { ProviderTrack } from "@/providers";

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

  async function onDownloadProgress(
    track: ProviderTrack,
    index: number,
    total: number,
  ): Promise<void> {
    await interaction.editReply(`Downloading \`${track.title}\` (${index}/${total})...`);
  }

  await interaction.deferReply();
  await interaction.editReply("Getting fresh playlist data...");
  const playlistIntId = interaction.options.getInteger("playlist", true);
  const update = await updatePlaylistInLibrary(playlistIntId, onDownloadProgress);
  if (!update || !update.operation) {
    await interaction.editReply("Something went wrong.");
  } else {
    await interaction.editReply(
      `Updated ${update.operation.diff} tracks in \`${update.playlistData.title}\``,
    );
  }
};
