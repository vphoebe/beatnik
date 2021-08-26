import { prisma } from "../lib/prisma";
import Discord from "discord.js";
import ytdl from "ytdl-core-discord";
import { MemoryQueue, MemoryQueues } from "..";
import clearQueue from "../commands/clearQueue";
import getDurationString from "../lib/duration";
import config from "../lib/readConfig";
const scdl = require("soundcloud-downloader").default;
const defaultVolume = config.default_volume;

const playNextTrack = async (guildId: string, memoryQueues: MemoryQueues, textChannel: Discord.TextChannel, voiceChannel: Discord.VoiceChannel) => {
  let memoryQueue = memoryQueues.get(guildId);

  if (!memoryQueue) {
    const newQueueConnection: MemoryQueue = {
      textChannel,
      voiceChannel,
      voiceConnection: null, // will be created on playback
      volume: defaultVolume,
      playing: false, // will set to true on playback
      currentIndex: 0, // start on first song
    };
    memoryQueues.set(guildId, newQueueConnection);
    memoryQueue = memoryQueues.get(guildId) as MemoryQueue; // we know this will exist now
  }

  if (!memoryQueue.voiceConnection) {
    const newConnection = await memoryQueue.voiceChannel.join();
    memoryQueue.voiceConnection = newConnection;
  }

  const voiceConnection = memoryQueue.voiceConnection;

  // find currently playing track
  const currentIdx = memoryQueue.currentIndex;
  const track = await prisma.track.findUnique({
    where: {
      queuePosition: {
        guildId,
        queueIndex: currentIdx,
      },
    },
  });

  // if next track isn't found, clear the queue and close the connection
  if (!track) {
    textChannel.send("Nothing is left in the queue.");
    return clearQueue(memoryQueue.textChannel, guildId, memoryQueues);
  }

  // get stream
  let streamSource;
  let streamType: Discord.StreamType = "opus";

  switch (track.service) {
    case "yt":
      streamSource = await ytdl(track.url);
      break;
    case "sc":
      streamSource = await scdl.download(track.url);
      streamType = "unknown";
      break;
    default:
      streamSource = "";
  }

  // play stream
  const dispatcher = voiceConnection.play(streamSource, { type: streamType });

  dispatcher.setVolume(memoryQueue.volume);

  dispatcher.on("start", () => {
    if (!memoryQueue) return;
    memoryQueue.playing = true;
    // send message in chat
    const nowPlayingEmbed = new Discord.MessageEmbed()
      .setAuthor("Now playing...")
      .setColor("#ed872d")
      .setTitle(track.title)
      .addField("Duration", getDurationString(track.lengthInSec), true)
      .addField("Queued by", track.user, true)
      .addField("Service", track.service === "yt" ? "YouTube" : "SoundCloud")
      .setThumbnail(track.thumbnailUrl ?? "")
      .setURL(track.url);
    textChannel.send(nowPlayingEmbed);
  });

  dispatcher.on("finish", () => {
    if (!memoryQueue) return;
    // on finish, increment the index and recurse
    memoryQueue.playing = false;
    memoryQueue.currentIndex += 1;
    playNextTrack(guildId, memoryQueues, textChannel, voiceChannel);
  });

  dispatcher.on("error", (error) => {
    if (!memoryQueue) return;
    memoryQueue.playing = false;
    console.error(`An error occurred for ${track.url}`);
    console.error(error);
    if (error.message.includes("Music Premium")) {
      textChannel.send(`**${track.title}** can't be played, as it's only available for Music Premium members. Skipping...`);
    } else {
      textChannel.send(`**${track.title}** can't be played, skipping...`);
    }
    memoryQueue.currentIndex += 1;
    playNextTrack(guildId, memoryQueues, textChannel, voiceChannel);
  });
};

export default playNextTrack;
