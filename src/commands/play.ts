import { Command, CommandExecuter } from ".";
import { Queue } from "../classes/Queue";
import { parsePlayQuery } from "../lib/parsePlayQuery";
import { guildQueues } from "../lib/queue";
import { parsedQueryToYoutubeQueuedTracks } from "../lib/services/youtube";
import { shuffleArray } from "../lib/util";
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
  const isNext = interaction.options.getBoolean("next") ?? undefined;
  const isShuffle = interaction.options.getBoolean("shuffle");

  if (!query) {
    await interaction.reply("Please provide a valid URL or search term.");
    return;
  }

  const existingQueue = guildQueues.has(guildId);
  let queue: Queue;
  if (existingQueue) {
    queue = guildQueues.get(guildId) as Queue;
  } else {
    const requestingUserId = interaction.user.id;
    const requestingMember =
      interaction.guild?.members.cache.get(requestingUserId);
    if (!requestingMember) throw new Error("noMemberFound");
    const voiceChannel = requestingMember.voice.channel;
    if (!voiceChannel) {
      await interaction.reply({
        content: "You must be in a voice channel to play music!",
        ephemeral: true,
      });
      return;
    }
    guildQueues.set(guildId, new Queue(voiceChannel, interaction.channel));
    queue = guildQueues.get(guildId) as Queue;
  }

  try {
    const parsedQuery = await parsePlayQuery(query);
    let tracks = await parsedQueryToYoutubeQueuedTracks(
      parsedQuery,
      interaction.user.id
    );
    if (isShuffle) {
      tracks = shuffleArray(tracks);
    }
    tracks.forEach((t) => queue.add(t, isNext));
    await interaction.reply({
      content: `Added ${tracks.length} track${
        tracks.length !== 1 ? "s" : ""
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
