import { Command, commandList } from "../index.js";
import { getClientId, getToken } from "../../lib/environment.js";
import { log } from "../../lib/logger.js";
import {
  REST,
  Routes,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { CommandInteraction } from "discord.js";

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

  rest
    .put(Routes.applicationGuildCommands(clientId, guildId), {
      body: guildCommands,
    })
    .then(async () => {
      log({
        type: "INFO",
        guildId,
        user: "BOT",
        message: "Registered guild commands",
      });
      await interaction.reply(`Beatnik commands installed!`);
    })
    .catch(console.error);
}

export default { builder, execute, global: true } as Command;
