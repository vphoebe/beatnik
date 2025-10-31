import { generateDependencyReport } from "@discordjs/voice";
import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  InteractionEditReplyOptions,
  InteractionReplyOptions,
} from "discord.js";
import { Client, Events, GatewayIntentBits } from "discord.js";
import fs from "node:fs";
import path from "node:path";

import { testLibraryConnection } from "@engine/library/operations";
import { getClient } from "@engine/youtube/client";

import { commandList } from "@commands/index";

import { getToken } from "@helpers/environment";
import { log } from "@helpers/logger";
import { errorReply } from "@helpers/messaging";
import { startPresenceLifecycle } from "@helpers/presence";
import type { Queue } from "@helpers/queue";

const token = getToken();

export const allGuildQueues = new Map<string, Queue>();

const pkgjson = fs.readFileSync(path.join(".", "package.json"), "utf-8");
export const BEATNIK_VERSION = JSON.parse(pkgjson).version;

console.log(`--------------------------------------------------
welcome to beatnik
version ${BEATNIK_VERSION}`);
console.log(generateDependencyReport());

// Create a new client instance
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

// When the client is ready, run this code (only once)
client.on(Events.ClientReady, async () => {
  await testLibraryConnection();
  await getClient();
  startPresenceLifecycle(client);
  log({
    type: "INFO",
    user: "BOT",
    message: "Beatnik is ready to go!",
  });
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isAutocomplete()) {
    const runCommand = commandList[interaction.commandName];
    if (!runCommand || !runCommand.autocomplete) return;
    try {
      await runCommand.autocomplete(interaction as AutocompleteInteraction);
    } catch (error) {
      console.error(error);
    }
  }

  if (interaction.isChatInputCommand()) {
    const runCommand = commandList[interaction.commandName];
    if (!runCommand) return;
    log({
      type: "CMD",
      user: interaction.user.username,
      message: `Ran ${interaction.commandName}`,
    });
    try {
      await runCommand.execute(interaction as ChatInputCommandInteraction);
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
});

client.on(Events.VoiceStateUpdate, async (oldState) => {
  const totalMembers = oldState.channel?.members.size;
  if (totalMembers === 1) {
    // just the bot remains, leave the channel
    try {
      const queue = allGuildQueues.get(oldState.guild.id);
      if (queue) {
        await queue.stop();
      }
    } catch (err) {
      console.error(err);
    }
  }
});

// Login to Discord with your client's token
client.login(token);
