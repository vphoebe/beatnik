import { Command, CommandExecuter } from "./index.js";
import { getAddedToQueueMessage } from "../lib/embeds.js";
import { getOrCreateQueue } from "../lib/queue.js";
import { SlashCommandBuilder } from "discord.js";

export const builder = new SlashCommandBuilder()
  .setName("play")
  .setDescription("Play/queue a track from a URL or search term.")
  .addStringOption((option) =>
    option
      .setName("query")
      .setDescription("A valid URL or search term to play.")
      .setRequired(true),
  )
  .addBooleanOption((option) =>
    option
      .setName("end")
      .setDescription("Add to the end of the queue, instead of next.")
      .setRequired(false),
  )
  .addBooleanOption((option) =>
    option
      .setName("shuffle")
      .setDescription("Shuffle the playlist before adding to the queue.")
      .setRequired(false),
  );

export const execute: CommandExecuter = async (interaction) => {
  const guildId = interaction.guildId;
  if (!guildId) return;

  await interaction.deferReply();
  const query = interaction.options.getString("query", true);
  const isEnd = interaction.options.getBoolean("end") ?? false;
  const isShuffle = interaction.options.getBoolean("shuffle") ?? false;

  if (!query) {
    await interaction.editReply("Please provide a valid URL or search term.");
    return;
  }

  const queue = await getOrCreateQueue(interaction);
  const numberAddedToQueue = await queue.enqueue(
    query,
    interaction.user.id,
    isShuffle,
    isEnd,
  );
  await interaction.editReply({
    content: getAddedToQueueMessage(
      numberAddedToQueue,
      queue.isPlaying,
      isEnd,
      isShuffle,
    ),
  });
  if (!queue.isPlaying) {
    await queue.play();
  }
  return;
};

export default { builder, execute, global: false } as Command;
