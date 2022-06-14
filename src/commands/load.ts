import { Command, CommandExecuter } from ".";
import { addToQueue } from "../lib/addToQueue";
import { getSavedUrl } from "../lib/db";
import { getAddedToQueueMessage } from "../lib/embeds";
import { getOrCreateQueue } from "../lib/queue";
import { errorReply } from "../lib/replies";
import { inlineCode, SlashCommandBuilder } from "@discordjs/builders";

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
      .setName("next")
      .setDescription("Play next instead of add to the end of queue.")
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

  await interaction.deferReply({ ephemeral: true });
  const name = interaction.options.getString("name", true);
  const isNext = interaction.options.getBoolean("next") ?? false;
  const isShuffle = interaction.options.getBoolean("shuffle") ?? false;
  const savedUrl = await getSavedUrl(guildId, name);

  if (!savedUrl) {
    await interaction.editReply({
      content: `No saved URL found for ${inlineCode(name)}.`,
    });
    return;
  }

  try {
    const queue = await getOrCreateQueue(interaction);
    const numberAddedToQueue = await addToQueue(
      queue,
      savedUrl,
      interaction.user.id,
      isShuffle,
      isNext
    );
    await interaction.editReply({
      content: getAddedToQueueMessage(
        numberAddedToQueue,
        queue.isPlaying,
        isNext,
        isShuffle
      ),
    });
    if (!queue.isPlaying) {
      await queue.play();
    }
    return;
  } catch (err) {
    console.error(err);
    await interaction.editReply(errorReply(err, false));
  }
};

export default { builder, execute, global: false } as Command;
