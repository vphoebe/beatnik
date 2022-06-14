import { Command, CommandExecuter } from ".";
import { getAllSavedUrls } from "../lib/db";
import { getSavedUrlListEmbed } from "../lib/embeds";
import { errorReply } from "../lib/replies";
import { SlashCommandBuilder } from "@discordjs/builders";

export const builder = new SlashCommandBuilder()
  .setName("list")
  .setDescription("View all saved URLs.");

export const execute: CommandExecuter = async (interaction) => {
  try {
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
  } catch (err) {
    console.error(err);
    await interaction.editReply(errorReply(err, false));
  }
};

export default { builder, execute, global: false } as Command;
