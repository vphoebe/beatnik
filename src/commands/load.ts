import { AutocompleteHandler, Command, CommandExecuter } from "./index.js";
import { getAddedToQueueMessage } from "../lib/embeds.js";
import { getOrCreateQueue } from "../lib/queue.js";
import { SlashCommandBuilder } from "discord.js";
import { getPlaylist, getPlaylists } from "../lib/library/db.js";

export const builder = new SlashCommandBuilder()
  .setName("load")
  .setDescription("Load a saved playlist by title, and start playing.")
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
  );

export const autocomplete: AutocompleteHandler = async (interaction) => {
  const savedPlaylists = await getPlaylists();
  const focusedValue = interaction.options.getFocused();
  const choices = savedPlaylists.map((sp) => ({
    name: sp.title,
    value: sp.int_id,
  }));
  await interaction.respond(
    choices.filter((c) => c.name.startsWith(focusedValue)),
  );
};

export const execute: CommandExecuter = async (interaction) => {
  const guildId = interaction.guildId;
  if (!guildId) return;

  await interaction.deferReply();
  const playlistIntId = interaction.options.getInteger("playlist", true);
  const isEnd = interaction.options.getBoolean("end") ?? false;
  const isShuffle = interaction.options.getBoolean("shuffle") ?? false;

  const queue = await getOrCreateQueue(interaction);
  const playlist = await getPlaylist(playlistIntId);

  if (!playlist) {
    await interaction.editReply("No playlist found.");
  } else {
    const numberAddedToQueue = await queue.addByQuery(
      playlist.url,
      interaction.user.id,
      isShuffle,
      isEnd,
    );
    await interaction.editReply({
      content: getAddedToQueueMessage(
        numberAddedToQueue,
        queue.isPlaying,
        isEnd,
        isShuffle,
      ),
    });
    if (!queue.isPlaying) {
      await queue.play();
    }
    return;
  }
};

export default { builder, execute, autocomplete, global: false } as Command;
