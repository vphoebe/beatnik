import { Command, CommandExecuter } from ".";
import { getExistingQueue } from "../lib/queue";
import { SlashCommandBuilder } from "@discordjs/builders";

export const builder = new SlashCommandBuilder()
  .setName("stop")
  .setDescription("Stop beatnik playback and clear the queue.");

export const execute: CommandExecuter = async (interaction) => {
  const guildId = interaction.guildId;
  if (!guildId) return;

  try {
    const queue = await getExistingQueue(interaction);
    if (!queue) {
      await interaction.reply(
        "No queue currently exists. Start playing something!"
      );
      return;
    }
    await queue.stop();
    await interaction.reply("Stopping and removing queue.");
  } catch (err) {
    console.error(err);
    await interaction.reply(`Something went wrong! ${err}`);
  }
};

export default { builder, execute, global: false } as Command;
