import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";

import { state } from "lib/othello/state.js";

import { Command } from "../index.js";

const data = new SlashCommandBuilder()
  .setName("pass")
  .setDescription("[Othello] Pass your turn to the other player.");

const execute = async (interaction: ChatInputCommandInteraction) => {
  const game = interaction.guildId ? state.get(interaction.guildId, interaction.user) : undefined;

  if (!game) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "Use /othello-start to start a new game!",
    });
    return;
  }
  const playerPiece = game.getPlayerPiece(interaction.user);
  if (!playerPiece) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "You're not playing! Wait until the next round...",
    });
    return;
  }
  if (playerPiece !== game.activePlayer) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "It's not your turn yet! Please hang on.",
    });
    return;
  }
  game.pass();

  await interaction.reply({
    content: `${interaction.user.displayName} passed their turn.`,
    embeds: [game.getEmbed()],
  });
  return;
};

const definition: Command = {
  builder: data as SlashCommandBuilder,
  execute,
};

export default definition;
