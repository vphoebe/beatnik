import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";

import { Command } from "../index.js";

const data = new SlashCommandBuilder()
  .setName("rules")
  .setDescription("[Othello] Learn the rules of Othello.");

const execute = async (interaction: ChatInputCommandInteraction) => {
  const rulesEmbed = new EmbedBuilder().setTitle("Othello - how to play").addFields([
    {
      name: "Rules",
      value: `Place your color piece to "outflank" the opponent's color, flipping their pieces to your color. You must place your piece adjacent to the opponent's piece. Your move must flip at least one of the opponent's colors. The player with the most tiles on the board once there are no moves remaining wins.`,
    },
    {
      name: "Commands",
      value: `Type \`/othello-start\` to start a new game, and choose a player for black and white.\nType \`/move\` with your grid coordinates to place your piece.\nType \`/pass\` to pass your turn to the other player, if you have no moves.`,
    },
  ]);

  await interaction.reply({
    ephemeral: true,
    embeds: [rulesEmbed],
  });
  return;
};

const definition: Command = {
  builder: data as SlashCommandBuilder,
  execute,
};

export default definition;
