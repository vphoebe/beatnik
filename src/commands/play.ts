import { Command, CommandExecuter } from ".";
import { addToQueue } from "../lib/addToQueue";
import { getAddedToQueueMessage } from "../lib/embeds";
import { getOrCreateQueue } from "../lib/queue";
import { errorReply } from "../lib/replies";
import { SlashCommandBuilder } from "@discordjs/builders";

export const builder = new SlashCommandBuilder()
  .setName("play")
  .setDescription("Play/queue a track from a URL or search term.")
  .addStringOption((option) =>
    option
      .setName("query")
      .setDescription("A valid URL or search term to play.")
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

  await interaction.deferReply();
  const query = interaction.options.getString("query", true);
  const isNext = interaction.options.getBoolean("next") ?? false;
  const isShuffle = interaction.options.getBoolean("shuffle") ?? false;

  if (!query) {
    await interaction.editReply("Please provide a valid URL or search term.");
    return;
  }

  try {
    const queue = await getOrCreateQueue(interaction);
    const numberAddedToQueue = await addToQueue(
      queue,
      query,
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
