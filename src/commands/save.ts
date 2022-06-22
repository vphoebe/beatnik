import { Command, CommandExecuter } from ".";
import { setSavedUrl } from "../lib/db";
import { log } from "../lib/logger";
import { errorReply } from "../lib/replies";
import {
  hideLinkEmbed,
  inlineCode,
  SlashCommandBuilder,
} from "@discordjs/builders";

export const builder = new SlashCommandBuilder()
  .setName("save")
  .setDescription("Save a URL so it can be easily found later.")
  .addStringOption((option) =>
    option
      .setName("name")
      .setDescription("Easy to remember name of the URL to use later.")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("url")
      .setDescription("Valid URL of track or playlist.")
      .setRequired(true)
  );

export const execute: CommandExecuter = async (interaction) => {
  const guildId = interaction.guildId;
  if (!guildId) return;
  const name = interaction.options.getString("name", true);
  const url = interaction.options.getString("url", true);

  try {
    const operation = await setSavedUrl(guildId, name, url);
    const messageContent = `${operation} ${hideLinkEmbed(url)} as ${inlineCode(
      name
    )} !`;
    log({
      type: "DB",
      guildId,
      user: interaction.user.username,
      message: messageContent,
    });
    await interaction.reply({
      content: messageContent,
      ephemeral: true,
    });
  } catch (err) {
    console.error(err);
    await interaction.reply(errorReply(err, false));
  }
};

export default { builder, execute, global: false } as Command;
