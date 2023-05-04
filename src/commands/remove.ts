import { Command, CommandExecuter } from './index.js';
import { removeSavedUrl } from '../lib/db.js';
import { getExistingQueue } from '../lib/queue.js';
import { noQueueReply } from '../lib/replies.js';
import { inlineCode, SlashCommandBuilder } from "@discordjs/builders";

export const builder = new SlashCommandBuilder()
  .setName("remove")
  .setDescription("Delete a track from the queue or a saved URL.")
  .addSubcommand((sc) =>
    sc
      .setName("queue")
      .setDescription("Delete a track from the queue.")
      .addIntegerOption((option) =>
        option
          .setName("track")
          .setDescription("Number of the track to remove from the queue.")
          .setRequired(true)
      )
  )
  .addSubcommand((sc) =>
    sc
      .setName("saved")
      .setDescription("Delete a saved URL.")
      .addStringOption((option) =>
        option
          .setName("name")
          .setDescription("Name of the saved URL to delete.")
          .setRequired(true)
      )
  );

export const execute: CommandExecuter = async (interaction) => {
  const guildId = interaction.guildId;
  if (!guildId) return;
  const subcommand = interaction.options.getSubcommand();
  if (subcommand === "queue") {
    const trackNumber = interaction.options.getInteger("track", true);
    const queue = await getExistingQueue(interaction);
    if (!queue) {
      await interaction.reply(noQueueReply);
      return;
    }
    const removed = queue.remove(trackNumber - 1);
    if (trackNumber - 1 === queue.currentIndex) {
      await queue.next();
    }
    await interaction.reply({
      content: `Removed ${removed[0].title} from queue!`,
      ephemeral: true,
    });
    return;
  } else if (subcommand === "saved") {
    const name = interaction.options.getString("name", true);
    const wasRemoved = await removeSavedUrl(guildId, name);
    if (wasRemoved) {
      await interaction.reply({
        content: `${inlineCode(name)} was removed.`,
      });
      return;
    } else {
      await interaction.reply({
        content: `No saved item found for ${inlineCode(name)}.`,
      });
    }
  } else {
    throw new Error("Unknown subcommand");
  }
};

export default { builder, execute, global: false } as Command;
