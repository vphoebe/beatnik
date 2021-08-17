import Discord, { Guild } from "discord.js";
import presence from "./lib/presence";
import handleMessage from "./commands/handleMessage";
import config from "./lib/readConfig";

export type MemoryQueue = {
  textChannel: Discord.TextChannel;
  voiceChannel: Discord.VoiceChannel;
  voiceConnection: Discord.VoiceConnection | null; // may be stopped
  currentIndex: number;
  volume: number;
  playing: boolean;
};

export type MemoryQueues = Map<String, MemoryQueue>;

const client = new Discord.Client();
const memoryQueues: MemoryQueues = new Map<Guild["id"], MemoryQueue>();

if (config.error) {
  console.error(config.error);
  process.exit();
}

client.once("ready", () => {
  console.log("== beatnik is ready ==");
  presence(client);
});

client.on("message", (message) => {
  handleMessage(message, memoryQueues);
});

// client.on("voiceStateUpdate", (oldState, newState) => {
//   // leave channel if it's just the bot
//   if (oldState.channelID !== oldState.guild.me?.voice.channelID || newState.channel) return;
//   const totalMembers = oldState.channel?.members.size;
//   if (totalMembers && totalMembers - 1 === 0) {
//     console.log(`Leaving voice channel ${oldState.channelID}`);
//     globalQueues.delete(oldState.guild.id);
//     return oldState.channel?.leave();
//   }
// });

client.login(config.discord_token);
