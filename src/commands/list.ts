import { Command, CommandExecuter } from ".";
import { getAllSavedUrls } from "../lib/db";
import { getSavedUrlListEmbed } from "../lib/embeds";
import { SlashCommandBuilder } from "@discordjs/builders";

export const builder = new SlashCommandBuilder()
  .setName("list")
  .setDescription("View all saved URLs.");

export const execute: CommandExecuter = async (interaction) => {
  const guildId = interaction.guildId;
  if (!guildId) return;
  const savedUrls = await getAllSavedUrls(guildId);
  if (savedUrls.length === 0) {
    await interaction.reply("No saved URLs in this server.");
    return;
  }
  const embed = await getSavedUrlListEmbed(savedUrls);
  await interaction.reply({ embeds: [embed], ephemeral: true });
  return;
};

export default { builder, execute, global: false } as Command;
