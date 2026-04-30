import { deletePlaylistFromLibrary, deleteTrackFromLibrary } from "@/core/cache/operations";
import { playlists } from "@/core/db/playlist";
import { tracks } from "@/core/db/track";
import { getSession } from "@/core/manager";
import type { AutocompleteHandler, CommandExecuter } from "@/discord/commands";
import { noQueueReply } from "@/discord/messaging";
import { MessageFlags, inlineCode } from "discord.js";

export const autocomplete: AutocompleteHandler = async (interaction) => {
  const focusedValue = interaction.options.getFocused(true);
  if (focusedValue.name === "playlist-name") {
    const savedPlaylists = playlists.all();
    const choices = savedPlaylists.map((sp) => ({
      name: sp.title,
      value: sp.int_id,
    }));
    await interaction.respond(
      choices.filter((c) => c.name.startsWith(focusedValue.value)).slice(0, 25),
    );
  } else if (focusedValue.name === "track-name") {
    const isolatedTracks = tracks.isolated();
    const choices = isolatedTracks.map((t) => ({ name: t.title, value: t.int_id }));
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
    const session = getSession(guildId);
    if (!session) {
      await interaction.reply(noQueueReply);
      return;
    }
    const removed = session.queue.remove(trackNumber - 1);
    if (trackNumber - 1 === session.queue.currentIndex) {
      await session.player.next();
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
