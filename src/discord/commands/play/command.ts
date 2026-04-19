import { getOrCreateSession } from "@/core/manager";
import { getOrCreateVoiceSession } from "@/discord/manager";
import { getAddedToQueueMessage, requireVoiceChannel } from "@/discord/messaging";

import type { CommandExecuter } from "..";

export const execute: CommandExecuter = async (interaction) => {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const voiceChannel = await requireVoiceChannel(interaction);
  if (!voiceChannel) return;
  const textChannel = interaction.channel;

  await interaction.deferReply();
  const query = interaction.options.getString("query", true);
  const isEnd = interaction.options.getBoolean("end") ?? false;
  const isShuffle = interaction.options.getBoolean("shuffle") ?? false;

  if (!query) {
    await interaction.editReply("Please provide a valid URL or search term.");
    return;
  }

  const { player } = getOrCreateSession(guildId);
  getOrCreateVoiceSession(voiceChannel, textChannel, player);

  const tracksAddedToQueue = await player.enqueue(query, interaction.user.id, isShuffle, isEnd);
  await interaction.editReply({
    content: getAddedToQueueMessage(tracksAddedToQueue, player.isPlaying, isEnd, isShuffle),
  });
  if (!player.isPlaying) {
    await player.play();
  }
  return;
};
