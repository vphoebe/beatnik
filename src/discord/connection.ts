import {
  VoiceConnectionStatus,
  entersState,
  getVoiceConnection,
  joinVoiceChannel,
} from "@discordjs/voice";
import type { VoiceBasedChannel } from "discord.js";

export function createVoiceConnection(channel: VoiceBasedChannel) {
  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
  });

  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    try {
      await Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
        entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
      ]);
      // Seems to be reconnecting to a new channel - ignore disconnect
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Seems to be a real disconnect which SHOULDN'T be recovered from
      connection.destroy();
    }
  });

  return connection;
}

export function getExistingVoiceConnection(guildId: string) {
  return getVoiceConnection(guildId);
}
