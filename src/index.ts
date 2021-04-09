import Discord from "discord.js";
import { token } from "./config.json";
import presence from "./presence/presence";
import { Queue, GlobalQueues } from "./types";
import { handleMessage } from "./commands/handleMessage";

const client = new Discord.Client();
const globalQueues: GlobalQueues = new Map<String, Queue>();

client.once("ready", () => {
  console.log("== beatnik is ready ==");
  presence(client);
});

client.on("message", (message) => handleMessage(message, globalQueues));

client.on("voiceStateUpdate", (oldState, newState) => {
  // leave channel if it's just the bot
  if (
    oldState.channelID !== oldState.guild.me?.voice.channelID ||
    newState.channel
  )
    return;
  const totalMembers = oldState.channel?.members.size;
  if (totalMembers && totalMembers - 1 === 0) {
    console.log(`Leaving voice channel ${oldState.channelID}`);
    globalQueues.delete(oldState.guild.id);
    return oldState.channel?.leave();
  }
});

client.login(token);
