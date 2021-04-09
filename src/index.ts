import Discord from "discord.js";
import { token } from "../config.json";
import presence from "./presence/presence";
import { Queue, BotQueue } from "./types";
import { handleMessage } from "./commands/handleMessage";

const client = new Discord.Client();
const botQueue: BotQueue = new Map<String, Queue>();

client.once("ready", () => {
  console.log("== beatnik is ready ==");
  presence(client);
});

client.once("reconnecting", () => {
  console.log("Reconnecting!");
});

client.once("disconnect", () => {
  console.log("Disconnect!");
});

client.on("message", (message) => handleMessage(message, botQueue));

client.on("voiceStateUpdate", (oldState, newState) => {
  // leave channel if it's just the bot
  if (
    oldState.channelID !== oldState.guild.me?.voice.channelID ||
    newState.channel
  )
    return;
  const totalMembers = oldState.channel?.members.size;
  if (totalMembers && totalMembers - 1 === 0)
    // - 1 for bot user
    return oldState.channel?.leave();
});

client.login(token);
