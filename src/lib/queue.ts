import { Queue } from '../classes/Queue.js';
import { CommandInteraction } from "discord.js";

export const allGuildQueues = new Map<string, Queue>();

function getVoiceChannelFromInteraction(interaction: CommandInteraction) {
  const requestingUserId = interaction.user.id;
  const requestingMember =
    interaction.guild?.members.cache.get(requestingUserId);
  if (!requestingMember)
    throw new Error("No guild member found for this user.");
  return requestingMember.voice.channel;
}

export async function getOrCreateQueue(
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
    const voiceChannel = getVoiceChannelFromInteraction(interaction);
    if (!voiceChannel) {
      throw new Error("Please join a voice channel to control the music!");
    }
    allGuildQueues.set(guildId, new Queue(voiceChannel, interaction.channel));
    queue = allGuildQueues.get(guildId) as Queue;
  }
  return queue;
}

export async function getExistingQueue(
  interaction: CommandInteraction
): Promise<Queue | undefined> {
  const guildId = interaction.guildId;
  if (!guildId) {
    throw new Error("Unable to find your guild ID. Are you in a server?");
  }
  const voiceChannel = getVoiceChannelFromInteraction(interaction);
  if (!voiceChannel) {
    throw new Error("Please join a voice channel to control the music!");
  }
  return allGuildQueues.get(guildId);
}

export async function destroyQueue(guildId: string) {
  allGuildQueues.delete(guildId);
}
