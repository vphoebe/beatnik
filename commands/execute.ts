import Discord from "discord.js";
import { Queue, BotQueue } from "../types";
import { youtubeKey, defaultVolume } from "../config.json";
import { play } from "./transport";
import ytdl from "ytdl-core";
import ytpl from "ytpl";
import YouTube from "discord-youtube-api";
const getRandomValues = require("get-random-values");
const youtube = new YouTube(youtubeKey);

function shuffle<T>(a: T[]) {
  var n = a.length, // The number of items left to shuffle (loop invariant)
    r = new Uint8Array(n), // Some random values
    k,
    t;
  getRandomValues(r);
  while (n > 1) {
    k = r[n - 1] % n; // 0 <= k < n
    t = a[--n]; // swap elements n and k
    a[n] = a[k];
    a[k] = t;
  }
  return a; // for a fluent API
}

export async function execute(
  message: Discord.Message,
  serverQueue: Queue,
  botQueue: BotQueue
) {
  if (message.member === null) return;
  if (message.client.user === null) return;

  const args = message.content.split(" ");

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel)
    return message.channel.send(
      "You need to be in a voice channel to play music!"
    );
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions) {
    return message.channel.send(
      `Failed to read permissions for ${message.client.user.username}`
    );
  }
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return message.channel.send(
      "I need the permissions to join and speak in your voice channel!"
    );
  }

  const url = args[1];
  const queuedSongs = [];
  const ytRegex = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w-]+\?v=|embed\/|v\/)?)([\w-]+)(\S+)?$/;

  if (ytRegex.test(url)) {
    if (url.includes("playlist")) {
      const playlistInfo = await ytpl(url, { pages: Infinity });
      const playlistSongs = playlistInfo.items.map((item) => ({
        title: item.title,
        url: item.shortUrl,
        user: message.author.username,
      }));
      if (message.content.includes(":shuffle")) shuffle(playlistSongs);
      queuedSongs.push(...playlistSongs);
      message.channel.send(`Added ${playlistSongs.length} items to the queue.`);
    } else {
      const songInfo = await ytdl.getInfo(url);
      const song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url,
        user: message.author.username,
      };
      queuedSongs.push(song);
    }
  } else {
    // treat as search query
    const query = args.slice(1).join(" ");
    const searchResult = await youtube.searchVideos(query);
    const song = {
      title: searchResult.title,
      url: searchResult.url,
      user: message.author.username,
    };
    queuedSongs.push(song);
  }

  if (!serverQueue) {
    const queueConstruct: Queue = {
      textChannel: message.channel as Discord.TextChannel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: defaultVolume,
      playing: true,
    };

    if (message.guild) {
      botQueue.set(message.guild.id, queueConstruct);
      queueConstruct.songs.push(...queuedSongs);
    }

    try {
      var connection = await voiceChannel.join();
      queueConstruct.connection = connection;
      if (message.guild) {
        play(message.guild, queueConstruct.songs[0], botQueue);
      }
    } catch (err) {
      console.log(err);
      if (message.guild !== null) {
        botQueue.delete(message.guild.id);
      }
      return message.channel.send(err);
    }
  } else {
    serverQueue.songs.push(...queuedSongs);
    if (queuedSongs.length === 1) {
      return message.channel.send(
        `${queuedSongs[0].title} has been added to the queue!`
      );
    } else {
      return message.channel.send(
        `${queuedSongs.length} tracks have been added to the queue!`
      );
    }
  }
}
