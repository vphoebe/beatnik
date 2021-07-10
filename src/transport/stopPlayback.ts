import Discord from "discord.js";
import { MemoryQueues } from "..";

const stopPlayback = async (channel: Discord.TextChannel, guildId: string, memoryQueues: MemoryQueues) => {
  const memoryQueue = memoryQueues.get(guildId);
  if (!memoryQueue) return channel.send("Nothing is playing!");
  memoryQueue.voiceConnection?.disconnect();
  memoryQueue.voiceConnection = null;
  memoryQueue.playing = false;
  return channel.send("Stopping playback.");
};

export default stopPlayback;
