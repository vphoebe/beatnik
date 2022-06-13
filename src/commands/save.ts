import { Command, CommandExecuter } from ".";
import { SavedUrl } from "../lib/db";
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
  const name = interaction.options.getString("name", true);
  const url = interaction.options.getString("url", true);

  const existing = await SavedUrl.findOne({ where: { guildId, name } });
  let operation = "Saved";

  if (existing) {
    existing.set({ url });
    await existing.save();
    operation = "Updated";
  } else {
    await SavedUrl.create({ guildId, name, url });
  }

  console.log("[DB]", operation, guildId, name, url);
  await interaction.reply({
    content: `${operation} ${hideLinkEmbed(url)} as ${inlineCode(name)} !`,
    ephemeral: true,
  });
};

export default { builder, execute, global: false } as Command;
