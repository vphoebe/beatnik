import { Command, CommandExecuter } from "./index.js";
import { getAllSavedUrls } from "../lib/db.js";
import { getSavedUrlListEmbed } from "../lib/embeds.js";
import { SlashCommandBuilder } from "discord.js";

export const builder = new SlashCommandBuilder()
  .setName("list")
  .setDescription("View all saved URLs.");

export const execute: CommandExecuter = async (interaction) => {
  const guildId = interaction.guildId;
  if (!guildId) return;
  await interaction.deferReply({ ephemeral: true });
  const savedUrls = await getAllSavedUrls(guildId);
  if (savedUrls.length === 0) {
    await interaction.editReply("No saved URLs in this server.");
    return;
  }
  const embed = await getSavedUrlListEmbed(savedUrls);
  await interaction.editReply({ embeds: [embed] });
  return;
};

export default { builder, execute, global: false } as Command;
