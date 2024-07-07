import { ChatInputCommandInteraction, SlashCommandBuilder, User } from "discord.js";

import { Game } from "../../lib/othello/game.js";
import { state } from "../../lib/othello/state.js";
import { Command } from "../index.js";

const data = new SlashCommandBuilder()
  .setName("othello-start")
  .setDescription("[Othello] Start a game of Othello between two users.")
  .addUserOption((option) =>
    option.setName("black").setDescription("Player for Black").setRequired(true),
  )
  .addUserOption((option) =>
    option.setName("white").setDescription("Player for White").setRequired(true),
  );

const execute = async (interaction: ChatInputCommandInteraction) => {
  const black = interaction.options.getUser("black") as User;
  const white = interaction.options.getUser("white") as User;
  if (!interaction.guildId) {
    await interaction.reply({
      ephemeral: true,
      content: "Use this command in a server to start a game.",
    });
    return;
  }
  let content = "";
  const existingGame = state.get(interaction.guildId, interaction.user);
  if (existingGame) {
    state.delete(interaction.guildId, interaction.user);
    content = `${interaction.user.displayName}'s previous game was deleted.`;
  }
  const newGame = new Game(black, white);
  state.set(interaction.guildId, newGame);

  await interaction.reply({
    content,
    embeds: [newGame.getEmbed()],
    ephemeral: false,
  });
};

const definition: Command = {
  builder: data as SlashCommandBuilder,
  execute,
  global: false,
};

export default definition;
