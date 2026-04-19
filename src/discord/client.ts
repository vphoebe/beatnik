import { getToken } from "@/core/environment";
import { getSession } from "@/core/manager";
import { log } from "@/shared";
import { generateDependencyReport } from "@discordjs/voice";
import type {
  Interaction,
  InteractionEditReplyOptions,
  InteractionReplyOptions,
  VoiceState,
} from "discord.js";
import { Client, Events, GatewayIntentBits } from "discord.js";

import { commandList } from "./commands";
import { deployCommands } from "./commands/deploy-commands";
import { errorReply } from "./messaging";
import { startPresenceLifecycle } from "./presence";

export async function handleInteraction(interaction: Interaction) {
  if (interaction.isAutocomplete()) {
    const command = commandList[interaction.commandName];
    if (!command?.autocomplete) return;
    try {
      await command.autocomplete(interaction);
    } catch (err) {
      console.error(err);
    }
  }

  if (interaction.isChatInputCommand()) {
    const command = commandList[interaction.commandName];
    if (!command) return;
    log({
      component: "DISCORD",
      name: interaction.guildId ?? "No guild",
      username: interaction.user.username,
      message: `Ran ${interaction.commandName}`,
    });
    try {
      await command.execute(interaction);
    } catch (err) {
      console.error(err);
      if (interaction.deferred) {
        await interaction.editReply(errorReply(err, false) as InteractionEditReplyOptions);
      } else {
        await interaction.reply(
          errorReply(err, interaction.ephemeral ?? false) as InteractionReplyOptions,
        );
      }
    }
  }
}

export async function handleVoiceStateUpdate(oldState: VoiceState) {
  if (oldState.channel?.members.size === 1) {
    try {
      const session = getSession(oldState.guild.id);
      await session?.player.stop();
    } catch (err) {
      console.error(err);
    }
  }
}

export async function startDiscord() {
  console.log(generateDependencyReport());
  await deployCommands();

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
  });

  client.on(Events.ClientReady, async () => {
    startPresenceLifecycle(client);
    log({ component: "DISCORD", name: "CLIENT", message: "Discord client is ready!" });
  });

  client.on(Events.InteractionCreate, handleInteraction);
  client.on(Events.VoiceStateUpdate, handleVoiceStateUpdate);

  await client.login(getToken());
}
