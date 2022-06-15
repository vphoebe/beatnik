import { Command, CommandExecuter } from ".";
import { getNowPlayingEmbed, getQueueListEmbed } from "../lib/embeds";
import { getExistingQueue } from "../lib/queue";
import { errorReply, noQueueReply } from "../lib/replies";
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

  try {
    const queue = await getExistingQueue(interaction);
    if (!queue) {
      await interaction.reply(noQueueReply);
      return;
    }

    let pageNumber = interaction.options.getInteger("page");
    const { tracks, pages, currentIndex, nowPlaying } = queue;
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
        tracks.length
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
      await interaction.reply("Nothing in the queue.");
    }
  } catch (err) {
    console.error(err);
    await interaction.reply(errorReply(err));
  }
};

export default { builder, execute, global: false } as Command;
