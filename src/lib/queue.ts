import { Queue } from "../classes/Queue";
import { CommandInteraction } from "discord.js";

const allGuildQueues = new Map<string, Queue>();

export async function getQueue(
  interaction: CommandInteraction
): Promise<Queue> {
  const guildId = interaction.guildId;
  if (!guildId) {
    throw new Error("Unable to find your guild ID. Are you in a server?");
  }
  const existingQueue = allGuildQueues.has(guildId);
  let queue: Queue;
  if (existingQueue) {
    queue = allGuildQueues.get(guildId) as Queue;
  } else {
    const requestingUserId = interaction.user.id;
    const requestingMember =
      interaction.guild?.members.cache.get(requestingUserId);
    if (!requestingMember)
      throw new Error("No guild member found for this user.");
    const voiceChannel = requestingMember.voice.channel;
    if (!voiceChannel) {
      throw new Error("Please join a voice channel to control the music!");
    }
    allGuildQueues.set(guildId, new Queue(voiceChannel, interaction.channel));
    queue = allGuildQueues.get(guildId) as Queue;
  }
  return queue;
}

export async function destroyQueue(guildId: string) {
  allGuildQueues.delete(guildId);
}
