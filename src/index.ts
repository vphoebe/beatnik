import { commandList } from "./commands";
import { getClientId, getToken } from "./lib/environment";
import { log } from "./lib/logger";
import { startPresenceLifecycle } from "./lib/presence";
import { allGuildQueues } from "./lib/queue";
import { errorReply } from "./lib/replies";
import { generateDependencyReport } from "@discordjs/voice";
import {
  ChatInputCommandInteraction,
  Client,
  GatewayIntentBits,
} from "discord.js";

const token = getToken();
const clientId = getClientId();

// Check for dependencies
log({
  type: "INFO",
  message: "Checking dependencies...",
  user: "BOT",
  guildId: clientId,
});
console.log(generateDependencyReport());

// Create a new client instance
export const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

// When the client is ready, run this code (only once)
client.once("ready", async () => {
  log({
    type: "INFO",
    user: "BOT",
    guildId: clientId,
    message: "Beatnik is ready to go!",
  });
  startPresenceLifecycle(client);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;
  log({
    type: "CMD",
    user: interaction.user.username,
    guildId: interaction.guildId ?? "N/A",
    message: `Ran ${interaction.commandName}`,
  });
  const runCommand = commandList[interaction.commandName];
  if (!runCommand) return;
  try {
    await runCommand.execute(interaction as ChatInputCommandInteraction);
  } catch (err) {
    console.error(err);
    if (interaction.deferred) {
      await interaction.editReply(
        errorReply(err, interaction.ephemeral ?? false)
      );
    } else {
      await interaction.reply(errorReply(err, interaction.ephemeral ?? false));
    }
  }
});

client.on("voiceStateUpdate", async (oldState) => {
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
