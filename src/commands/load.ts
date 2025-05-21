import { SlashCommandBuilder } from "discord.js";

import { getAddedToQueueMessage } from "lib/embeds.js";
import { getPlaylists, getPlaylist } from "lib/library/db/playlist.js";
import { getAllTracks, getTrackByIntId } from "lib/library/db/track.js";
import { getOrCreateQueue } from "lib/queue.js";

import { AutocompleteHandler, Command, CommandExecuter } from "./index.js";

export const builder = new SlashCommandBuilder()
  .setName("load")
  .setDescription("Load music from your library.")
  .addSubcommand((sc) =>
    sc
      .setName("playlist")
      .setDescription("Load a saved playlist.")
      .addIntegerOption((option) =>
        option
          .setName("playlist")
          .setDescription("The saved playlist.")
          .setRequired(true)
          .setAutocomplete(true),
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
      ),
  )
  .addSubcommand((sc) =>
    sc
      .setName("track")
      .setDescription("Load a saved track.")
      .addIntegerOption((option) =>
        option
          .setName("track")
          .setDescription("The saved track.")
          .setRequired(true)
          .setAutocomplete(true),
      ),
  );

export const autocomplete: AutocompleteHandler = async (interaction) => {
  const focusedValue = interaction.options.getFocused(true);
  if (focusedValue.name === "playlist") {
    const savedPlaylists = await getPlaylists();
    const choices = savedPlaylists.map((sp) => ({
      name: sp.title,
      value: sp.int_id,
    }));
    await interaction.respond(
      choices
        .filter((c) => c.name.toLocaleUpperCase().includes(focusedValue.value.toLocaleUpperCase()))
        .slice(0, 25),
    );
  } else if (focusedValue.name === "track") {
    const tracks = await getAllTracks();
    const choices = tracks.map((t) => ({
      name: `${t.title} (${t.channelName})`.slice(0, 100),
      value: t.int_id,
    }));
    await interaction.respond(
      choices
        .filter((c) => c.name.toLocaleUpperCase().includes(focusedValue.value.toLocaleUpperCase()))
        .slice(0, 25),
    );
  }
};

export const execute: CommandExecuter = async (interaction) => {
  const guildId = interaction.guildId;
  if (!guildId) return;
  await interaction.deferReply();

  const subcommand = interaction.options.getSubcommand();
  const queue = await getOrCreateQueue(interaction);
  const isEnd = interaction.options.getBoolean("end") ?? false;
  const isShuffle = interaction.options.getBoolean("shuffle") ?? false;

  let queryUrl = "";

  if (subcommand === "playlist") {
    const playlistIntId = interaction.options.getInteger("playlist", true);
    const playlist = await getPlaylist(playlistIntId);

    if (!playlist) {
      await interaction.editReply("No playlist found.");
      return;
    }

    queryUrl = playlist.url;
  }

  if (subcommand === "track") {
    const trackIntId = interaction.options.getInteger("track", true);
    const track = await getTrackByIntId(trackIntId);
    if (!track) {
      await interaction.editReply("No track found.");
      return;
    }
    queryUrl = track.url;
  }

  const numberAddedToQueue = await queue.enqueue(queryUrl, interaction.user.id, isShuffle, isEnd);
  await interaction.editReply({
    content: getAddedToQueueMessage(numberAddedToQueue, queue.isPlaying, isEnd, isShuffle),
  });
  if (!queue.isPlaying) {
    await queue.play();
  }
  return;
};

export default { builder, execute, autocomplete } as Command;
