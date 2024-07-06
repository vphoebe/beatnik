import { Command, CommandExecuter } from "./index.js";
import { log } from "../lib/logger.js";
import { hideLinkEmbed, inlineCode, SlashCommandBuilder } from "discord.js";
import { getTracksFromQuery } from "../lib/youtube/metadata.js";
import { saveTrack } from "../lib/db.js";
import { addTrack } from "../lib/library.js";

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

  const tracks = await getTracksFromQuery(query);

  const testTrack = tracks.tracks[0];

  const addOp = await addTrack(testTrack);

  if (!addOp.added) {
    await interaction.editReply("Didn't add anything");
  } else {
    await interaction.editReply("Done");
  }
};

export default { builder, execute, global: false } as Command;
