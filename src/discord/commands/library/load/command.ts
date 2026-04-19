import { playlists } from "@/core/db/playlist";
import { tracks } from "@/core/db/track";
import type { AutocompleteHandler, CommandExecuter } from "@/discord/commands";
import { enqueueAndPlay } from "@/discord/playback";

export const autocomplete: AutocompleteHandler = async (interaction) => {
  const focusedValue = interaction.options.getFocused(true);
  if (focusedValue.name === "playlist") {
    const savedPlaylists = playlists.all();
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
    const allTracks = tracks.all();
    const choices = allTracks.map((t) => ({
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
  await interaction.deferReply();

  const subcommand = interaction.options.getSubcommand();
  const isEnd = interaction.options.getBoolean("end") ?? false;
  const isShuffle = interaction.options.getBoolean("shuffle") ?? false;

  let queryUrl = "";

  if (subcommand === "playlist") {
    const playlistIntId = interaction.options.getInteger("playlist", true);
    const playlist = playlists.getInfo(playlistIntId);
    if (!playlist) {
      await interaction.editReply("No playlist found.");
      return;
    }
    queryUrl = playlist.url;
  }

  if (subcommand === "track") {
    const trackIntId = interaction.options.getInteger("track", true);
    const track = tracks.getInternal(trackIntId);
    if (!track) {
      await interaction.editReply("No track found.");
      return;
    }
    queryUrl = track.url;
  }

  await enqueueAndPlay(interaction, queryUrl, { shuffle: isShuffle, end: isEnd });
};
