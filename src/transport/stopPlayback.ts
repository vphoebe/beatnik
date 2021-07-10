import Discord from "discord.js";
import { QueueConnections } from "..";

const stopPlayback = async (channel: Discord.TextChannel, guildId: string, queueConnections: QueueConnections) => {
  const queueConnection = queueConnections.get(guildId);
  if (!queueConnection) return channel.send("Nothing is playing!");
  queueConnection.voiceConnection?.disconnect();
  return channel.send("Stopping playback.");
};

export default stopPlayback;
