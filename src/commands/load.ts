import { Command, CommandExecuter } from "./index.js";
import { getSavedUrl } from "../lib/db.js";
import { getAddedToQueueMessage } from "../lib/embeds.js";
import { getOrCreateQueue } from "../lib/queue.js";
import { inlineCode, SlashCommandBuilder } from "discord.js";

export const builder = new SlashCommandBuilder()
  .setName("load")
  .setDescription("Load a saved URL by name and start playing.")
  .addStringOption((option) =>
    option
      .setName("name")
      .setDescription("Name of the saved URL.")
      .setRequired(true)
  )
  .addBooleanOption((option) =>
    option
      .setName("end")
      .setDescription("Add to the end of the queue, instead of next.")
      .setRequired(false)
  )
  .addBooleanOption((option) =>
    option
      .setName("shuffle")
      .setDescription("Shuffle the playlist before adding to the queue.")
      .setRequired(false)
  );

export const execute: CommandExecuter = async (interaction) => {
  const guildId = interaction.guildId;
  if (!guildId) return;

  await interaction.deferReply();
  const name = interaction.options.getString("name", true);
  const isEnd = interaction.options.getBoolean("end") ?? false;
  const isShuffle = interaction.options.getBoolean("shuffle") ?? false;
  const savedUrl = await getSavedUrl(guildId, name);

  if (!savedUrl) {
    await interaction.editReply({
      content: `No saved URL found for ${inlineCode(name)}.`,
    });
    return;
  }

  const queue = await getOrCreateQueue(interaction);
  const numberAddedToQueue = await queue.addByQuery(
    savedUrl,
    interaction.user.id,
    isShuffle,
    isEnd
  );
  await interaction.editReply({
    content: getAddedToQueueMessage(
      numberAddedToQueue,
      queue.isPlaying,
      isEnd,
      isShuffle
    ),
  });
  if (!queue.isPlaying) {
    await queue.play();
  }
  return;
};

export default { builder, execute, global: false } as Command;
