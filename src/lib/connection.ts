import {
  entersState,
  getVoiceConnection,
  joinVoiceChannel,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import { VoiceBasedChannel } from "discord.js";

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
    } catch (error) {
      // Seems to be a real disconnect which SHOULDN'T be recovered from
      connection.destroy();
    }
  });

  // https://github.com/discordjs/discord.js/issues/9185#issuecomment-1459083216 ????
  const networkStateChangeHandler = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    oldNetworkState: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    newNetworkState: any
  ) => {
    const newUdp = Reflect.get(newNetworkState, "udp");
    clearInterval(newUdp?.keepAliveInterval);
  };

  connection.on("stateChange", (oldState, newState) => {
    Reflect.get(oldState, "networking")?.off(
      "stateChange",
      networkStateChangeHandler
    );
    Reflect.get(newState, "networking")?.on(
      "stateChange",
      networkStateChangeHandler
    );
  });

  return connection;
}

export function getExistingVoiceConnection(guildId: string) {
  return getVoiceConnection(guildId);
}
