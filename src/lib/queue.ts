import { Queue } from "../classes/Queue";
import { CommandInteraction } from "discord.js";

export const guildQueues = new Map<string, Queue>();

export async function getQueue(
  interaction: CommandInteraction
): Promise<Queue> {
  const guildId = interaction.guildId;
  if (!guildId) {
    throw new Error("Invalid guildId");
  }
  const existingQueue = guildQueues.has(guildId);
  let queue: Queue;
  if (existingQueue) {
    queue = guildQueues.get(guildId) as Queue;
  } else {
    const requestingUserId = interaction.user.id;
    const requestingMember =
      interaction.guild?.members.cache.get(requestingUserId);
    if (!requestingMember) throw new Error("noMemberFound");
    const voiceChannel = requestingMember.voice.channel;
    if (!voiceChannel) {
      throw new Error("notInVoiceChannel");
    }
    guildQueues.set(guildId, new Queue(voiceChannel, interaction.channel));
    queue = guildQueues.get(guildId) as Queue;
  }
  return queue;
}
