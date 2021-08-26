import Discord from "discord.js";
import { MemoryQueues } from "..";

const stopPlayback = async (guildId: string, memoryQueues: MemoryQueues, channel?: Discord.TextChannel) => {
  const memoryQueue = memoryQueues.get(guildId);
  if (!memoryQueue && channel) return channel.send("Nothing is playing!");
  if (!memoryQueue) return;
  memoryQueue.voiceConnection?.disconnect();
  memoryQueue.voiceConnection = null;
  memoryQueue.playing = false;
  if (channel) channel.send("Nothing is currently playing to stop.");
  return;
};

export default stopPlayback;
