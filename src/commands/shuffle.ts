import { Command, CommandExecuter } from ".";
import { Queue } from "../classes/Queue";
import { guildQueues } from "../lib/queue";
import { SlashCommandBuilder } from "@discordjs/builders";

export const builder = new SlashCommandBuilder()
  .setName("shuffle")
  .setDescription(
    "Shuffles the current queue and starts playback from the top."
  );

export const execute: CommandExecuter = async (interaction) => {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const existingQueue = guildQueues.has(guildId);
  let queue: Queue;
  if (existingQueue) {
    queue = guildQueues.get(guildId) as Queue;
    await queue.shuffle();
    await interaction.reply({
      content: "Shuffled the queue!",
      ephemeral: true,
    });
  } else {
    await interaction.reply("Nothing is in the queue right now to shuffle.");
  }
};

export default { builder, execute, global: false } as Command;
