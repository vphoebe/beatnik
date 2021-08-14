import Discord from "discord.js";
import { MemoryQueues } from "..";
import playNextTrack from "./playNextTrack";

const changeTrack = async (channel: Discord.TextChannel, guildId: string, memoryQueues: MemoryQueues, type: "absolute" | "relative", index: number) => {
  const memoryQueue = memoryQueues.get(guildId);
  if (!memoryQueue) return channel.send("Nothing is playing right now. To use this command, start playback.");
  switch (type) {
    case "relative":
      if (memoryQueue.currentIndex === 0 && index < 0) return channel.send("The current track is first in the queue.");
      memoryQueue.currentIndex += index;
      break;
    case "absolute":
      memoryQueue.currentIndex = index - 1;
  }

  playNextTrack(guildId, memoryQueues, channel, memoryQueue.voiceChannel);
};

export default changeTrack;
