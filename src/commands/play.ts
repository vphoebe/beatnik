import { Command, CommandExecuter } from ".";
import { addToQueue } from "../lib/addToQueue";
import { getQueue } from "../lib/queue";
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

  const query = interaction.options.getString("query", true);
  const isNext = interaction.options.getBoolean("next") ?? false;
  const isShuffle = interaction.options.getBoolean("shuffle") ?? false;

  if (!query) {
    await interaction.reply("Please provide a valid URL or search term.");
    return;
  }

  try {
    const queue = await getQueue(interaction);
    const numberAddedToQueue = await addToQueue(
      queue,
      query,
      interaction.user.id,
      isShuffle,
      isNext
    );
    await interaction.reply({
      content: `Added ${numberAddedToQueue} track${
        numberAddedToQueue !== 1 ? "s" : ""
      } to the ${isNext ? "start" : "end"} of the queue. ${
        !queue.isPlaying ? "Starting playback!" : ""
      }`,
      ephemeral: true,
    });
    if (!queue.isPlaying) {
      await queue.play();
    }
    return;
  } catch (err) {
    console.error(err);
    await interaction.reply(`Something went wrong: ${err}!`);
  }
};

export default { builder, execute, global: false } as Command;
