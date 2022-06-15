import { Command, commandList } from "..";
import { getClientId, getToken } from "../../lib/environment";
import { SlashCommandBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { PermissionFlagsBits, Routes } from "discord-api-types/v9";
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

  const rest = new REST({ version: "9" }).setToken(token);

  rest
    .put(Routes.applicationGuildCommands(clientId, guildId), {
      body: guildCommands,
    })
    .then(async () => {
      console.log(
        `Successfully registered application commands to ${guildId}.`
      );
      await interaction.reply(`Beatnik commands installed!`);
    })
    .catch(console.error);
}

export default { builder, execute, global: true } as Command;
