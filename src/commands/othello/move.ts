import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";

import { gridToCoords } from "lib/othello/coordinates";
import { state } from "lib/othello/state";

import { Command } from "../index";

const data = new SlashCommandBuilder()
  .setName("move")
  .setDescription("[Othello] Enter coordinates to make your move.")
  .addStringOption((option) =>
    option
      .setName("coordinates")
      .setDescription("Enter grid coordinates (eg. C4)")
      .setRequired(true)
      .setMinLength(2)
      .setMaxLength(2),
  );

const execute = async (interaction: ChatInputCommandInteraction) => {
  const game = interaction.guildId ? state.get(interaction.guildId, interaction.user) : undefined;

  if (!game || !interaction.guildId) {
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

  const input = interaction.options.getString("coordinates")?.toLocaleUpperCase() as string; // required
  const coords = gridToCoords(input);
  if (!coords) {
    await interaction.reply({ flags: MessageFlags.Ephemeral, content: "Invalid move." });
    return;
  }
  const wasValidMove = game.move(coords.x, coords.y, playerPiece);
  if (!wasValidMove) {
    await interaction.reply({ flags: MessageFlags.Ephemeral, content: "Invalid move." });
    return;
  }

  let winner;
  const isFinished = game.isFinished();
  if (isFinished) winner = game.getWinner();

  let winnerText = "";

  if (winner) {
    winnerText = `${winner.user.displayName} is the winner!`;
  } else if (isFinished && !winner) {
    winnerText = "It's a tie!";
  }

  await interaction.reply({
    content: `${interaction.user.displayName} placed a ${game.theme.squares[playerPiece]} piece on ${input}. ${winnerText}`,
    embeds: [game.getEmbed(winner?.piece)],
  });
  if (winner) {
    state.delete(interaction.guildId, interaction.user);
  }
  return;
};

const definition: Command = {
  builder: data as SlashCommandBuilder,
  execute,
};

export default definition;
