import { Command, CommandExecuter } from ".";
import { getQueue } from "../lib/queue";
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
    const queue = await getQueue(interaction);
    await queue.shuffle();
    await interaction.reply({
      content: "Shuffled the queue!",
      ephemeral: true,
    });
  } catch (err) {
    console.error(err);
    await interaction.reply(`Something went wrong! ${err}`);
  }
};

export default { builder, execute, global: false } as Command;
