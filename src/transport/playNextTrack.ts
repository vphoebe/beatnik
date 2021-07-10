import { PrismaClient } from "@prisma/client";
import Discord from "discord.js";
import ytdl from "ytdl-core-discord";
import { QueueConnection, QueueConnections } from "..";
import clearQueue from "../commands/clearQueue";
import getDurationString from "../util/duration";
import config from "../util/readConfig";
const scdl = require("soundcloud-downloader").default;

const prisma = new PrismaClient();
const defaultVolume = config.default_volume;

const playNextTrack = async (guildId: string, queueConnections: QueueConnections, textChannel: Discord.TextChannel, voiceChannel: Discord.VoiceChannel) => {
  let queueConnection = queueConnections.get(guildId);

  if (!queueConnection) {
    const newQueueConnection: QueueConnection = {
      textChannel,
      voiceChannel,
      voiceConnection: null, // will be created on playback
      volume: defaultVolume,
      playing: false, // will set to true on playback
      currentIndex: 0, // start on first song
    };
    queueConnections.set(guildId, newQueueConnection);
    queueConnection = queueConnections.get(guildId) as QueueConnection; // we know this will exist now
  }

  if (!queueConnection.voiceConnection) {
    const newConnection = await queueConnection.voiceChannel.join();
    queueConnection.voiceConnection = newConnection;
  }

  const voiceConnection = queueConnection.voiceConnection;

  // find currently playing track
  const currentIdx = queueConnection.currentIndex;
  const track = await prisma.track.findUnique({
    where: {
      queue_id: {
        guildId,
        queueIndex: currentIdx,
      },
    },
  });

  // if next track isn't found, clear the queue and close the connection
  if (!track) {
    textChannel.send("Nothing is left in the queue.");
    return clearQueue(queueConnection.textChannel, guildId, queueConnections);
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

  dispatcher.setVolume(queueConnection.volume);

  dispatcher.on("start", () => {
    if (!queueConnection) return;
    queueConnection.playing = true;
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
    if (!queueConnection) return;
    // on finish, increment the index and recurse
    queueConnection.playing = false;
    queueConnection.currentIndex += 1;
    playNextTrack(guildId, queueConnections, textChannel, voiceChannel);
  });

  dispatcher.on("error", (error) => {
    if (!queueConnection) return;
    queueConnection.playing = false;
    console.error(`An error occurred for ${track.url}`);
    console.error(error);
    if (error.message.includes("Music Premium")) {
      textChannel.send(`**${track.title}** can't be played, as it's only available for Music Premium members. Skipping...`);
    } else {
      textChannel.send(`**${track.title}** can't be played, skipping...`);
    }
    queueConnection.currentIndex += 1;
    playNextTrack(guildId, queueConnections, textChannel, voiceChannel);
  });
};

export default playNextTrack;
