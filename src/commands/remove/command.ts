import { MessageFlags, inlineCode } from "discord.js";

import { getPlaylists } from "@engine/library/db/playlist";
import { getIsolatedTracks } from "@engine/library/db/track";
import { deletePlaylistFromLibrary, deleteTrackFromLibrary } from "@engine/library/operations";

import type { AutocompleteHandler, CommandExecuter } from "@commands/index";

import { noQueueReply } from "@helpers/messaging";
import { getExistingQueue } from "@helpers/queue";

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
      flags: MessageFlags.Ephemeral,
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
