import Discord from "discord.js";
import { token } from "./config.json";
import presence from "./presence/presence";
import { Queue, BotQueue } from "./types";
import { handleMessage } from "./commands/handleMessage";

const client = new Discord.Client();
const botQueue: BotQueue = new Map<String, Queue>();

client.once("ready", () => {
  console.log("Ready!");
  presence(client);
});

client.once("reconnecting", () => {
  console.log("Reconnecting!");
});

client.once("disconnect", () => {
  console.log("Disconnect!");
});

client.on("message", (message) => handleMessage(message, botQueue));

client.login(token);
