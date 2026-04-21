import type { LibraryOperationResult } from "@/core/cache/operations";
import { addPlaylistToLibrary, addTrackToLibrary } from "@/core/cache/operations";
import { resolveQuery } from "@/core/resolvers";
import type { CommandExecuter } from "@/discord/commands";
import type { ProviderTrack } from "@/providers";

export const execute: CommandExecuter = async (interaction) => {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const query = interaction.options.getString("query", true);
  await interaction.deferReply();

  await interaction.editReply(
    `Finding metadata for your query... please wait (this can take a while).`,
  );

  const { type, metadata, provider } = await resolveQuery(query);
  if (!metadata) return;

  const count = type === "playlist" ? metadata.tracks.length : 1;
  await interaction.editReply(`Adding and downloading ${count} track(s)...`);

  async function onDownloadProgress(
    track: ProviderTrack,
    index: number,
    total: number,
  ): Promise<void> {
    await interaction.editReply(`Downloading \`${track.title}\` (${index}/${total})...`);
  }

  let operation: LibraryOperationResult | null;

  if (type === "playlist") {
    operation = await addPlaylistToLibrary(metadata, provider, onDownloadProgress);
  } else if (type === "track" || type === "search") {
    operation = await addTrackToLibrary(metadata, provider);
  } else {
    operation = null;
  }

  const title = metadata.title;

  if (!operation) {
    await interaction.editReply(`Something went wrong.`);
  } else if (operation.error === "EXISTS") {
    await interaction.editReply(`${title} was already added.`);
  } else {
    await interaction.editReply(
      `${operation.updated ? "Updated" : "Added"} ${operation.diff} tracks for \`${title ?? "unknown"}\``,
    );
  }
};
