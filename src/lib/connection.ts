import { getVoiceConnection, joinVoiceChannel } from "@discordjs/voice";
import { VoiceBasedChannel } from "discord.js";

export function createVoiceConnection(channel: VoiceBasedChannel) {
  return joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
  });
}

export function getExistingVoiceConnection(guildId: string) {
  return getVoiceConnection(guildId);
}
