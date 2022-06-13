import { commandList } from "./commands";
import { connectToDb } from "./lib/db";
import { getToken } from "./lib/environment";
import { Client, Intents } from "discord.js";

// Create a new client instance
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES],
});
const token = getToken();

// When the client is ready, run this code (only once)
client.once("ready", async () => {
  await connectToDb();
  console.log("~~ beatnik is ready to go! ~~");
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;
  const runCommand = commandList[interaction.commandName];
  if (!runCommand) return;
  try {
    await runCommand.execute(interaction);
  } catch (err) {
    console.error(err);
    await interaction.reply({
      content: "There was an error while executing this command!",
      ephemeral: true,
    });
  }
});

// Login to Discord with your client's token
client.login(token);
