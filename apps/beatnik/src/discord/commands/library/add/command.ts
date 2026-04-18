import { type CommandExecuter } from "../..";
import {
  type LibraryOperationResult,
  addPlaylistToLibrary,
  addTrackToLibrary,
} from "../../../../core/cache/operations";
import { agnosticResolve } from "../../../../core/resolve";

export const execute: CommandExecuter = async (interaction) => {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const query = interaction.options.getString("query", true);
  await interaction.deferReply();

  await interaction.editReply(
    `Finding metadata for your query... please wait (this can take a while).`,
  );

  const { type, metadata, provider } = await agnosticResolve(query);
  if (!metadata) return;

  const count = type === "playlist" ? metadata.tracks.length : 1;
  await interaction.editReply(`Adding and downloading ${count} track(s)... please wait.`);

  let operation: LibraryOperationResult | null;

  if (type === "playlist") {
    operation = await addPlaylistToLibrary(metadata, provider);
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
      `${operation.updated ? "Updated" : "Added"} and downloaded "${title ?? "unknown"}" to the library!`,
    );
  }
};
