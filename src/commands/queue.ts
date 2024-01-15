import { Command, CommandExecuter } from "./index.js";
import { getNowPlayingEmbed, getQueueListEmbed } from "../lib/embeds.js";
import { getExistingQueue } from "../lib/queue.js";
import { noQueueReply } from "../lib/replies.js";
import { SlashCommandBuilder } from "discord.js";

export const builder = new SlashCommandBuilder()
  .setName("queue")
  .setDescription("View the current queue.")
  .addIntegerOption((option) =>
    option
      .setName("page")
      .setDescription("Specify the page number of the queue to view")
      .setRequired(false)
  );

export const execute: CommandExecuter = async (interaction) => {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const queue = await getExistingQueue(interaction);
  if (!queue) {
    await interaction.reply(noQueueReply);
    return;
  }

  let pageNumber = interaction.options.getInteger("page");
  const { tracks, pages, currentIndex, nowPlaying, playingFromCache } = queue;
  if (!pageNumber) {
    // get now playing track's page
    pageNumber = Math.ceil((currentIndex + 1) / 10);
  }

  if (tracks.length > 0) {
    const totalPages = pages;
    const pagedTracks = queue.getPage(pageNumber);
    if (!pagedTracks) {
      await interaction.reply({
        content: `Invalid page number: ${pageNumber}.`,
        ephemeral: true,
      });
      return;
    }
    const nowPlayingEmbed = getNowPlayingEmbed(
      nowPlaying,
      currentIndex + 1,
      tracks.length,
      playingFromCache
    );
    const queueListEmbed = getQueueListEmbed(
      pagedTracks,
      pageNumber,
      totalPages,
      currentIndex
    );
    await interaction.reply({
      embeds: [nowPlayingEmbed, queueListEmbed],
      ephemeral: true,
    });
    return;
  } else {
    await interaction.reply({
      content: "Nothing in the queue.",
      ephemeral: true,
    });
  }
};

export default { builder, execute, global: false } as Command;
