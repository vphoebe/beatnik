import { REST, Routes, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { CommandInteraction } from "discord.js";

import { getClientId, getToken } from "../../lib/environment.js";
import { log } from "../../lib/logger.js";
import { Command, commandList } from "../index.js";

export const builder = new SlashCommandBuilder()
  .setName("install")
  .setDescription("Installs or updates Beatnik slash commands on your server.")
  .setDMPermission(false)
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: CommandInteraction) {
  const guildId = interaction.guildId;
  if (!guildId) return;
  const guildCommands = Object.keys(commandList)
    .filter((key) => !commandList[key].global)
    .map((key) => commandList[key].builder.toJSON());

  const token = getToken();
  const clientId = getClientId();

  const rest = new REST().setToken(token);

  try {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: guildCommands,
    });
    log({
      type: "INFO",
      guildId,
      user: "BOT",
      message: "Registered guild commands",
    });
    await interaction.reply("Beatnik commands installed!");
  } catch (err) {
    console.error(err);
    await interaction.reply("Error adding Beatnik commands.");
  }
}

export default { builder, execute, global: true } as Command;
