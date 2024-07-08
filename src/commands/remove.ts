import { inlineCode, SlashCommandBuilder } from "discord.js";

import { getPlaylists } from "../lib/library/db/playlist.js";
import { getIsolatedTracks } from "../lib/library/db/track.js";
import { deletePlaylistFromLibrary, deleteTrackFromLibrary } from "../lib/library/index.js";
import { getExistingQueue } from "../lib/queue.js";
import { noQueueReply } from "../lib/replies.js";
import { AutocompleteHandler, Command, CommandExecuter } from "./index.js";

export const builder = new SlashCommandBuilder()
  .setName("remove")
  .setDescription("Delete a track from the queue or a saved URL.")
  .addSubcommand((sc) =>
    sc
      .setName("queue")
      .setDescription("Delete a track from the queue.")
      .addIntegerOption((option) =>
        option
          .setName("track")
          .setDescription("Number of the track to remove from the queue.")
          .setRequired(true),
      ),
  )
  .addSubcommand((sc) =>
    sc
      .setName("playlist")
      .setDescription("Delete a playlist from the library.")
      .addIntegerOption((option) =>
        option
          .setName("playlist-name")
          .setDescription("Name of the playlist to delete.")
          .setRequired(true)
          .setAutocomplete(true),
      ),
  )
  .addSubcommand((sc) =>
    sc
      .setName("saved-track")
      .setDescription("Delete a saved track from the library.")
      .addIntegerOption((option) =>
        option
          .setName("track-name")
          .setDescription("Name of the track to delete.")
          .setRequired(true)
          .setAutocomplete(true),
      ),
  );

export const autocomplete: AutocompleteHandler = async (interaction) => {
  const focusedValue = interaction.options.getFocused(true);
  if (focusedValue.name === "playlist-name") {
    const savedPlaylists = await getPlaylists();
    const choices = savedPlaylists.map((sp) => ({
      name: sp.title,
      value: sp.int_id,
    }));
    await interaction.respond(
      choices.filter((c) => c.name.startsWith(focusedValue.value)).slice(0, 25),
    );
  } else if (focusedValue.name === "track-name") {
    const tracks = await getIsolatedTracks();
    const choices = tracks.map((t) => ({ name: t.title, value: t.int_id }));
    await interaction.respond(
      choices.filter((c) => c.name.startsWith(focusedValue.value)).slice(0, 25),
    );
  }
};

export const execute: CommandExecuter = async (interaction) => {
  const guildId = interaction.guildId;
  if (!guildId) return;
  const subcommand = interaction.options.getSubcommand();
  if (subcommand === "queue") {
    const trackNumber = interaction.options.getInteger("track", true);
    const queue = await getExistingQueue(interaction);
    if (!queue) {
      await interaction.reply(noQueueReply);
      return;
    }
    const removed = queue.remove(trackNumber - 1);
    if (trackNumber - 1 === queue.currentIndex) {
      await queue.next();
    }
    await interaction.reply({
      content: `Removed ${removed[0].title} from queue!`,
      ephemeral: true,
    });
    return;
  } else if (subcommand === "playlist") {
    const int_id = interaction.options.getInteger("playlist-name", true);
    const operation = await deletePlaylistFromLibrary(int_id);
    if (operation) {
      await interaction.reply({
        content: `${inlineCode(operation.title)} was removed.`,
      });
    } else {
      await interaction.reply("Something went wrong.");
    }

    return;
  } else if (subcommand === "saved-track") {
    const int_id = interaction.options.getInteger("track-name", true);
    const removedTrack = await deleteTrackFromLibrary(int_id);
    await interaction.reply({
      content: `${inlineCode(removedTrack?.title ?? "")} was removed.`,
    });
  } else {
    throw new Error("Unknown subcommand");
  }
};

export default { builder, execute, autocomplete, global: false } as Command;
