import { getOrCreateSession, getSession } from "@/core/manager";
import { getNowPlayingEmbed, getQueueListEmbed, noQueueReply } from "@/discord/messaging";
import { MessageFlags } from "discord.js";

import type { CommandExecuter } from "../index";

export const execute: CommandExecuter = async (interaction) => {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const queueExists = getSession(guildId);
  if (!queueExists) {
    await interaction.reply(noQueueReply);
    return;
  }

  const { queue } = getOrCreateSession(guildId);

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
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const nowPlayingEmbed =
      nowPlaying && getNowPlayingEmbed(nowPlaying, currentIndex + 1, tracks.length);
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
