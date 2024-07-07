import { Command, CommandExecuter } from "./index.js";
import { SlashCommandBuilder } from "discord.js";
import { getMetadataFromQuery } from "../lib/youtube/metadata.js";
import { AddOperation, addPlaylist, addTrack } from "../lib/library/cache.js";

export const builder = new SlashCommandBuilder()
  .setName("add")
  .setDescription(
    "Add a track or playlist to the library and download it for future playback.",
  )
  .addStringOption((option) =>
    option
      .setName("query")
      .setDescription(
        "Valid URL of track or playlist, or a search query to save the first result.",
      )
      .setRequired(true),
  );

export const execute: CommandExecuter = async (interaction) => {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const query = interaction.options.getString("query", true);
  await interaction.deferReply();

  await interaction.editReply(
    `Finding metadata for your query... Please wait.`,
  );
  const queryResult = await getMetadataFromQuery(query, false);
  const count = queryResult?.playlist ? queryResult.playlist.tracks.length : 1;

  await interaction.editReply(
    `Adding and downloading ${count} track(s)... Please wait.`,
  );

  let operation: AddOperation | null;
  if (queryResult?.playlist) {
    operation = await addPlaylist(queryResult.playlist);
  } else if (queryResult?.track) {
    operation = await addTrack(queryResult?.track);
  } else {
    operation = null;
  }

  if (!operation) {
    await interaction.editReply(`Something went wrong.`);
  } else if (operation.error === "EXISTS") {
    await interaction.editReply(
      `${queryResult?.track?.title} was already added.`,
    );
  } else {
    const title = queryResult?.track?.title || queryResult?.playlist?.title;
    await interaction.editReply(
      `${operation.updated ? "Updated" : "Added"} and downloaded "${title ?? "unknown"}" to the library!`,
    );
  }
};

export default { builder, execute, global: false } as Command;
