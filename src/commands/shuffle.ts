import { Command, CommandExecuter } from ".";
import { getExistingQueue } from "../lib/queue";
import { errorReply, noQueueReply } from "../lib/replies";
import { SlashCommandBuilder } from "@discordjs/builders";

export const builder = new SlashCommandBuilder()
  .setName("shuffle")
  .setDescription(
    "Shuffles the current queue and starts playback from the top."
  );

export const execute: CommandExecuter = async (interaction) => {
  const guildId = interaction.guildId;
  if (!guildId) return;

  try {
    const queue = await getExistingQueue(interaction);
    if (!queue) {
      await interaction.reply(noQueueReply);
      return;
    }
    await queue.shuffle();
    await interaction.reply({
      content: "Shuffled the queue!",
      ephemeral: true,
    });
  } catch (err) {
    console.error(err);
    await interaction.reply(errorReply(err));
  }
};

export default { builder, execute, global: false } as Command;
