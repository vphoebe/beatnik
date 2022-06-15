import { commandList } from "./commands";
import { getToken } from "./lib/environment";
import { startPresenceLifecycle } from "./lib/presence";
import { allGuildQueues } from "./lib/queue";
import { generateDependencyReport } from "@discordjs/voice";
import { Client, Intents } from "discord.js";

// Check for dependencies
console.log(generateDependencyReport());

// Create a new client instance
export const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES],
});

const token = getToken();

// When the client is ready, run this code (only once)
client.once("ready", async () => {
  console.log("~~ Beatnik is ready to go! ~~");
  startPresenceLifecycle(client);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;
  const runCommand = commandList[interaction.commandName];
  if (!runCommand) return;
  try {
    await runCommand.execute(interaction);
    console.log(
      `[COM] ${interaction.guildId}: ${interaction.commandName}: ${interaction.user.username}`
    );
  } catch (err) {
    console.error(err);
    await interaction.reply({
      content: "There was an error while executing this command!",
      ephemeral: true,
    });
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
