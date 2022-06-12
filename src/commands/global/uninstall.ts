import { Command } from "..";
import { getClientId, getToken } from "../../lib/environment";
import { SlashCommandBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { CommandInteraction } from "discord.js";

export const builder = new SlashCommandBuilder()
  .setName("uninstall")
  .setDescription("Uninstalls beatnik slash commands from your server.");

export async function execute(interaction: CommandInteraction) {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const token = getToken();
  const clientId = getClientId();

  const rest = new REST({ version: "9" }).setToken(token);

  rest
    .get(Routes.applicationGuildCommands(clientId, guildId))
    .then(async (data) => {
      const typeSafeData = data as { id: string }[];
      const promises = typeSafeData.map((command) =>
        rest.delete(
          `${Routes.applicationGuildCommands(clientId, guildId)}/${command.id}`
        )
      );
      await Promise.all(promises);
      console.log(`Beatnik uninstalled from ${guildId}.`);
      await interaction.reply("Beatnik has been uninstalled from this server.");
    });
}

export default { builder, execute, global: true } as Command;
