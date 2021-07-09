import Discord from "discord.js";
import ytdl from "ytdl-core-discord";
import ytpl from "ytpl";
import YouTube from "discord-youtube-api";
import config from "../util/readConfig";
import { QueueConnection, QueueConnections } from "..";
import { PrismaClient, Track } from "@prisma/client";
import shuffleArray from "../util/shuffleArray";

const youtubeKey = config.youtube_token;
const defaultVolume = config.default_volume;
const scdl = require("soundcloud-downloader").default;
const ytsearch = new YouTube(youtubeKey);

type QueueableTrack = Omit<Track, "queueIndex">;

const prisma = new PrismaClient();

const addToQueue = async (message: Discord.Message, queueConnections: QueueConnections, location: "next" | "end") => {
  // ensure correct conditions
  if (message.member === null) return;
  if (message.client.user === null) return;
  if (message.guild === null) return;

  const voiceChannel = message.member.voice.channel;
  const guildId = message.guild.id;

  if (!voiceChannel) {
    return message.channel.send(`${message.member.user.username}, you need to join a voice channel before controlling the music.`);
  }
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions) {
    return message.channel.send(`Failed to read permissions for ${message.client.user.username}`);
  }
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return message.channel.send("I don't have permission to join and speak in your voice channel.");
  }

  // prepare request
  const args = message.content.split(" ");
  const url = args[1];

  const detectedType = (url: string) => {
    const globalUrlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
    const ytRegex = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w-]+\?v=|embed\/|v\/)?)([\w-]+)(\S+)?$/;
    const scRegex = /^https?:\/\/(soundcloud\.com|snd\.sc)\/(.*)$/;
    if (ytRegex.test(url)) {
      if (url.includes("playlist")) return "yt-pl";
      else return "yt-song";
    } else if (scRegex.test(url)) {
      return "sc-song";
    } else if (globalUrlRegex.test(url)) {
      return "unknown-url";
    } else {
      return "yt-search";
    }
  };

  let preparedTracks: QueueableTrack[] = [];

  switch (detectedType(url)) {
    case "yt-pl":
      // youtube playlist
      message.channel.send("Processing playlist request...");
      const playlistInfo = await ytpl(url, { pages: Infinity });
      const playlistTracks: QueueableTrack[] = playlistInfo.items.map((item) => ({
        service: "yt",
        title: item.title,
        url: item.shortUrl,
        user: message.author.username,
        thumbnailUrl: item.bestThumbnail.url ?? "",
        lengthInSec: item.durationSec ?? 0,
        guildId,
      }));
      if (message.content.includes(":shuffle")) shuffleArray(playlistTracks);
      preparedTracks.push(...playlistTracks);
      break;

    case "yt-song":
      // youtube song
      const ytSongInfo = await ytdl.getInfo(url);
      const ytSong: QueueableTrack = {
        service: "yt",
        title: ytSongInfo.videoDetails.title,
        url: ytSongInfo.videoDetails.video_url,
        user: message.author.username,
        thumbnailUrl: ytSongInfo.thumbnail_url ?? "",
        lengthInSec: parseInt(ytSongInfo.videoDetails.lengthSeconds),
        guildId,
      };
      preparedTracks.push(ytSong);
      break;

    case "sc-song":
      // play a soundcloud url
      const scSongInfo = await scdl.getInfo(url);
      const scSong: QueueableTrack = {
        service: "sc",
        title: scSongInfo.title ?? "Unknown title",
        url: scSongInfo.permalink_url ?? "https://soundcloud.com",
        user: message.author.username,
        thumbnailUrl: scSongInfo.artwork_url ?? "",
        lengthInSec: (scSongInfo.full_duration ?? 0) / 1000, // this api returns ms
        guildId,
      };
      preparedTracks.push(scSong);
      break;

    case "yt-search":
      // treat as youtube search query (single song)
      const query = args.slice(1).join(" ");
      if (query.length > 0) {
        const searchResult = await ytsearch.searchVideos(query);
        const ytSearchedSong: QueueableTrack = {
          service: "yt",
          title: searchResult.title,
          url: searchResult.url,
          lengthInSec: searchResult.durationSeconds,
          thumbnailUrl: searchResult.thumbnail,
          user: message.author.username,
          guildId,
        };
        preparedTracks.push(ytSearchedSong);
      }
      break;

    case "unknown-url":
      return message.channel.send("I don't recognize this URL. Supported services are YouTube and SoundCloud!");
    default:
      return message.channel.send("Enter a YouTube URL or search term to play a track.");
  }

  // set preparedTracks into database
  const queueConnection = queueConnections.get(guildId);
  let idxOffset = -1;
  if (!queueConnection) {
    // create a queue connection
    try {
      const voiceConnection = await voiceChannel.join();
      const newQueueConnection: QueueConnection = {
        textChannel: message.channel as Discord.TextChannel,
        voiceChannel,
        voiceConnection,
        volume: defaultVolume,
        playing: true,
        currentIndex: 0,
        totalQueueLength: preparedTracks.length,
      };
      queueConnections.set(guildId, newQueueConnection);
    } catch (err) {
      console.log(`Error creating queue connection for ${guildId}`);
      console.log(err);
      return message.channel.send("Error creating queue.");
    }
  } else {
    // set idxOffset to current length
    idxOffset = queueConnection.totalQueueLength - 1;
    // add length to queueConnection
    queueConnection.totalQueueLength += preparedTracks.length;
  }
  // add queue to database with relatively adjusted indicies
  switch (location) {
    case "next":
      const databaseTracks: Track[] = preparedTracks.map((track, idx) => {
        return {
          ...track,
          queueIndex: idx + idxOffset + 1,
        };
      });

      try {
        for (const dbTrack of databaseTracks) {
          await prisma.track.create({
            data: dbTrack,
          });
        }

        const testQuery = await prisma.track.findMany({
          where: {
            guildId: guildId,
          },
        });

        console.log(testQuery);
      } catch (err) {
        console.log(err);
      }
      break;

    case "end":
      // shift all db indicies for this request
      break;
  }
};

export default addToQueue;
