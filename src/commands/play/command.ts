import { getAddedToQueueMessage } from "lib/embeds";
import { getOrCreateQueue } from "lib/queue";

import { CommandExecuter } from "..";

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
  const numberAddedToQueue = await queue.enqueue(query, interaction.user.id, isShuffle, isEnd);
  await interaction.editReply({
    content: getAddedToQueueMessage(numberAddedToQueue, queue.isPlaying, isEnd, isShuffle),
  });
  if (!queue.isPlaying) {
    await queue.play();
  }
  return;
};
