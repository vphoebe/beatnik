import { Command, CommandExecuter } from ".";
import { getNowPlayingEmbed, getQueueListEmbed } from "../lib/embeds";
import { guildQueues } from "../lib/queue";
import { SlashCommandBuilder } from "@discordjs/builders";

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

  const queue = guildQueues.get(guildId);
  let pageNumber = interaction.options.getInteger("page");

  if (!queue) {
    await interaction.reply(
      "No queue exists for this server right now. Start playing something!"
    );
    return;
  }

  const { tracks, pages, currentIndex, nowPlaying } = queue;

  if (!pageNumber) {
    // get now playing track's page
    pageNumber = Math.ceil((currentIndex + 1) / 10);
  }

  const queuedTracks = tracks;
  if (queuedTracks.length > 0) {
    const totalPages = pages;
    const pagedTracks = queue.getPage(pageNumber);
    if (!pagedTracks) {
      await interaction.reply({
        content: `Invalid page number: ${pageNumber}.`,
        ephemeral: true,
      });
      return;
    }
    const nowPlayingEmbed = getNowPlayingEmbed(nowPlaying);
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
    await interaction.reply("Nothing in the queue.");
  }
};

export default { builder, execute, global: false } as Command;
