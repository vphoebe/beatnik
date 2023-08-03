import { Command } from "../index.js";
import { getClientId, getToken } from "../../lib/environment.js";
import { log } from "../../lib/logger.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { PermissionFlagsBits, Routes } from "discord-api-types/v9";
import { CommandInteraction } from "discord.js";

export const builder = new SlashCommandBuilder()
  .setName("uninstall")
  .setDescription("Uninstalls Beatnik slash commands from your server.")
  .setDMPermission(false)
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
export async function execute(interaction: CommandInteraction) {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const token = getToken();
  const clientId = getClientId();

  const rest = new REST().setToken(token);

  rest
    .put(Routes.applicationGuildCommands(clientId, guildId), { body: [] })
    .then(async () => {
      log({
        type: "INFO",
        user: "BOT",
        guildId,
        message: `Uninstalled guild commands.`,
      });
      await interaction.reply("Beatnik has been uninstalled from this server.");
    })
    .catch(console.error);
}

export default { builder, execute, global: true } as Command;
