import Discord from "discord.js";
import ytdl from "ytdl-core-discord";
import ytpl from "ytpl";
import YouTube from "discord-youtube-api";
import config from "../lib/readConfig";
import { MemoryQueues } from "..";
import { prisma, Track } from "../lib/prisma";
import shuffleArray from "../lib/shuffleArray";
import playNextTrack from "../transport/playNextTrack";
import getDurationString from "../lib/duration";

const youtubeKey = config.youtube_token;
const scdl = require("soundcloud-downloader").default;
const ytsearch = new YouTube(youtubeKey);
const prefix = config.prefix;

type QueueableTrack = Omit<Track, "queueIndex">;

const addToQueue = async (message: Discord.Message, memoryQueues: MemoryQueues, location: "next" | "end") => {
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
      console.log(`Calling YouTube API for playlist ${url}`);
      const playlistInfo = await ytpl(url, { pages: Infinity });
      console.log(`Playlist discovered with ${playlistInfo.items.length} tracks.`);
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

  const memoryQueue = memoryQueues.get(guildId);

  const nowPlayingEmbed = new Discord.MessageEmbed()
    .setAuthor("Added to queue...")
    .setColor("#ed872d")
    .setTitle(preparedTracks[0].title)
    .addField("Duration", getDurationString(preparedTracks[0].lengthInSec), true)
    .addField("Queued by", preparedTracks[0].user, true)
    .addField("Service", preparedTracks[0].service === "yt" ? "YouTube" : "SoundCloud")
    .setThumbnail(preparedTracks[0].thumbnailUrl ?? "")
    .setURL(preparedTracks[0].url);

  switch (location) {
    case "end":
      try {
        const guildQueueItems = await prisma.track.findMany({
          where: {
            guildId,
          },
        });

        const queueLength = guildQueueItems.length; // current length of queue in db

        const databaseTracksEnd: Track[] = preparedTracks.map((track, idx) => {
          return {
            ...track,
            queueIndex: idx + queueLength,
          };
        });

        // for (const dbTrack of databaseTracksEnd) {
        //   await prisma.track.create({
        //     data: dbTrack,
        //   });
        // }

        console.log(`Adding ${preparedTracks.length} tracks to the database...`);
        const op = await prisma.track.createMany({
          data: databaseTracksEnd,
        });
        console.log(`${op.count} added to the database succesfully.`);

        message.channel.send(`${databaseTracksEnd.length} track(s) added to the end of the queue.`);
        message.channel.send(nowPlayingEmbed);
      } catch (err) {
        console.log(err);
      }
      break;

    case "next":
      try {
        const currentIndex = memoryQueue?.currentIndex ?? -1;
        const databaseTracksNext: Track[] = preparedTracks.map((track, idx) => {
          // these are going to the front of the queue. add to current idx
          return {
            ...track,
            queueIndex: idx + currentIndex + 1,
          };
        });

        // but, we need to shift the indxs in the db
        // since the queueIndex has to be unique,
        // we have to start at the highest and increment from there

        const dbQueueItems = await prisma.track.findMany({
          orderBy: [{ queueIndex: "desc" }],
          where: {
            guildId,
          },
        });

        // if something is playing now, we need to leave its index alone
        // along with everything behind it in the queue
        const filteredDbQueueItems = dbQueueItems.filter((item) => item.queueIndex > currentIndex);

        for (const dbQItem of filteredDbQueueItems) {
          await prisma.track.update({
            where: {
              queue_id: {
                guildId: dbQItem.guildId,
                queueIndex: dbQItem.queueIndex,
              },
            },
            data: {
              queueIndex: {
                increment: databaseTracksNext.length,
              },
            },
          });
        }

        // now we add the new tracks
        for (const dbTrack of databaseTracksNext) {
          await prisma.track.create({
            data: dbTrack,
          });
        }

        message.channel.send(`${databaseTracksNext.length} track(s) added the queue.`);
        message.channel.send(`${databaseTracksNext[0].title} will play next.`);
        message.channel.send(nowPlayingEmbed);
      } catch (err) {
        console.log(err);
      } finally {
        await prisma.$disconnect();
      }
      break;
  }

  if (!memoryQueue) {
    try {
      playNextTrack(guildId, memoryQueues, message.channel as Discord.TextChannel, voiceChannel);
    } catch (err) {
      console.log(`Error creating queue connection for ${guildId}`);
      console.log(err);
      return message.channel.send("Error creating queue.");
    }
  } // else the tracks just get added and the playback will take care of it
};

export default addToQueue;
