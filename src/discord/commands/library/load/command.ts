import { playlists } from "@/core/db/playlist";
import { tracks } from "@/core/db/track";
import { getOrCreateSession } from "@/core/manager";
import type { AutocompleteHandler, CommandExecuter } from "@/discord/commands";
import { getOrCreateVoiceSession } from "@/discord/manager";
import { getAddedToQueueMessage, requireVoiceChannel } from "@/discord/messaging";

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
  const guildId = interaction.guildId;
  if (!guildId) return;
  await interaction.deferReply();

  const voiceChannel = await requireVoiceChannel(interaction);
  if (!voiceChannel) return;
  const textChannel = interaction.channel;

  const { player } = getOrCreateSession(guildId);
  getOrCreateVoiceSession(voiceChannel, textChannel, player);

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

  const tracksAddedToQueue = await player.enqueue(queryUrl, interaction.user.id, isShuffle, isEnd);
  await interaction.editReply({
    content: getAddedToQueueMessage(tracksAddedToQueue, player.isPlaying, isEnd, isShuffle),
  });
  if (!player.isPlaying) {
    await player.play();
  }
  return;
};
