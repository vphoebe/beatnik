import { config } from "@/core/config";
import { playlists } from "@/core/db/playlist";
import { enqueueAndPlay } from "@/discord/playback";
import { MessageFlags } from "discord.js";

import type { CommandExecuter } from "../..";

export const execute: CommandExecuter = async (interaction) => {
  if (interaction.user.id !== config.discord.coachUserId) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "You are not The Coach :born2lee: - sorry bud!",
    });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const queryUrls: string[] = [];

  const allPlaylistIds = playlists.all().map((pl) => pl.int_id);
  allPlaylistIds.forEach((int_id) => {
    const playlist = playlists.getInfo(int_id);
    if (playlist?.url) queryUrls.push(playlist.url);
  });

  await enqueueAndPlay(interaction, queryUrls, { shuffle: true, end: false });

  await interaction.editReply({
    content: `You got it, Coach. Enjoy the tunes!`,
  });
};
