import { getOrCreateSession } from "@/core/manager";
import { getOrCreateVoiceSession } from "@/discord/manager";
import { getAddedToQueueMessage, requireVoiceChannel } from "@/discord/messaging";
import type { ProviderTrack } from "@/providers";
import type { ChatInputCommandInteraction } from "discord.js";

export async function enqueueAndPlay(
  interaction: ChatInputCommandInteraction,
  query: string,
  options: { shuffle?: boolean; end?: boolean } = {},
) {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const voiceChannel = await requireVoiceChannel(interaction);
  if (!voiceChannel) return;

  const { shuffle = false, end = false } = options;
  const { player } = getOrCreateSession(guildId);
  getOrCreateVoiceSession(voiceChannel, interaction.channel, player);

  const tracks = await player.enqueue(query, interaction.user.id, shuffle, end);

  // interaction is already deferred
  await interaction.editReply({
    content: getAddedToQueueMessage(tracks, player.isPlaying, end, shuffle),
  });

  if (!player.isPlaying) {
    await player.play();
  }
}

export function createDownloadProgressHandler(interaction: ChatInputCommandInteraction) {
  return async function (track: ProviderTrack, index: number, total: number) {
    await interaction.editReply(`Downloading \`${track.title}\` (${index}/${total})...`);
  };
}
