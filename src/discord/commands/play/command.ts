import type { CommandExecuter } from "@/discord/commands";
import { enqueueAndPlay } from "@/discord/playback";

export const execute: CommandExecuter = async (interaction) => {
  await interaction.deferReply();
  const query = interaction.options.getString("query", true);
  await enqueueAndPlay(interaction, [query], {
    shuffle: interaction.options.getBoolean("shuffle") ?? false,
    end: interaction.options.getBoolean("end") ?? false,
  });
};
