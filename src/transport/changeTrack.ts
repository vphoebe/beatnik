import Discord from "discord.js";
import { MemoryQueues } from "..";
import playNextTrack from "./playNextTrack";

const changeTrack = async (channel: Discord.TextChannel, guildId: string, memoryQueues: MemoryQueues, relativeIndex: number) => {
  const memoryQueue = memoryQueues.get(guildId);
  if (!memoryQueue) return channel.send("Nothing is playing!");
  // increment currentIndex and play it
  if (memoryQueue.currentIndex === 0 && relativeIndex < 0) return channel.send("The current track is first in the queue.");
  memoryQueue.currentIndex += relativeIndex;
  playNextTrack(guildId, memoryQueues, channel, memoryQueue.voiceChannel);
};

export default changeTrack;
