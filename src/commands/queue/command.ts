import { MessageFlags } from "discord.js";
import type { CommandExecuter } from "commands/index";
import { getNowPlayingEmbed, getQueueListEmbed } from "discord/messaging";
import { noQueueReply } from "discord/messaging";
import { getExistingQueue } from "discord/queue";

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
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const nowPlayingEmbed =
      nowPlaying &&
      getNowPlayingEmbed(nowPlaying, currentIndex + 1, tracks.length, playingFromCache);
    const queueListEmbed = getQueueListEmbed(pagedTracks, pageNumber, totalPages, currentIndex);

    const sendEmbeds = [queueListEmbed];
    if (nowPlayingEmbed) {
      sendEmbeds.unshift(nowPlayingEmbed);
    }
    await interaction.reply({
      embeds: sendEmbeds,
      flags: MessageFlags.Ephemeral,
    });
    return;
  } else {
    await interaction.reply({
      content: "Nothing in the queue.",
      flags: MessageFlags.Ephemeral,
    });
  }
};
