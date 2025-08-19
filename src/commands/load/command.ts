import { getPlaylist, getPlaylists } from "@engine/library/db/playlist";
import { getAllTracks, getTrackByIntId } from "@engine/library/db/track";

import type { AutocompleteHandler, CommandExecuter } from "@commands/index";

import { getAddedToQueueMessage } from "@helpers/messaging";
import { getOrCreateQueue } from "@helpers/queue";

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

  const tracksAddedToQueue = await queue.enqueue(queryUrl, interaction.user.id, isShuffle, isEnd);
  await interaction.editReply({
    content: getAddedToQueueMessage(tracksAddedToQueue, queue.isPlaying, isEnd, isShuffle),
  });
  if (!queue.isPlaying) {
    await queue.play();
  }
  return;
};
