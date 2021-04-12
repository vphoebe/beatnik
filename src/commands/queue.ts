import Discord from "discord.js";
import { Queue, GlobalQueues, PlaylistSong } from "../types";
import { youtubeKey, defaultVolume } from "../config.json";
import { play } from "./transport";
import ytdl from "ytdl-core";
import ytpl from "ytpl";
import YouTube from "discord-youtube-api";
const scdl = require("soundcloud-downloader").default;
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

export async function queue(
  message: Discord.Message,
  guildQueue: Queue,
  globalQueues: GlobalQueues
) {
  if (message.member === null) return;
  if (message.client.user === null) return;
  if (message.guild === null) return;

  const args = message.content.split(" ");

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel)
    return message.channel.send(
      `${message.member.user.username}, you need to join a voice channel before controlling the music.`
    );
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions) {
    return message.channel.send(
      `Failed to read permissions for ${message.client.user.username}`
    );
  }
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return message.channel.send(
      "I don't have permission to join and speak in your voice channel."
    );
  }

  const url = args[1];
  const queuedSongs: PlaylistSong[] = [];
  const globalUrlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
  const ytRegex = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w-]+\?v=|embed\/|v\/)?)([\w-]+)(\S+)?$/;
  const scRegex = /^https?:\/\/(soundcloud\.com|snd\.sc)\/(.*)$/;

  if (ytRegex.test(url)) {
    // play a youtube url
    try {
      if (url.includes("playlist")) {
        const playlistInfo = await ytpl(url, { pages: Infinity });
        const playlistSongs = playlistInfo.items.map((item) => ({
          service: "yt",
          title: item.title,
          url: item.shortUrl,
          user: message.author.username,
          thumbnail: item.bestThumbnail.url,
          length: item.durationSec,
        }));
        if (message.content.includes(":shuffle")) shuffle(playlistSongs);
        queuedSongs.push(...playlistSongs);
        message.channel.send(
          `Added ${playlistSongs.length} items to the queue.`
        );
      } else {
        const songInfo = await ytdl.getInfo(url);
        const song = {
          service: "yt",
          title: songInfo.videoDetails.title,
          url: songInfo.videoDetails.video_url,
          user: message.author.username,
          thumbnail: songInfo.thumbnail_url,
          length: parseInt(songInfo.videoDetails.lengthSeconds),
        };
        queuedSongs.push(song);
      }
    } catch (err) {
      console.error(err);
      message.channel.send(
        "I couldn't play that track... try another link or search."
      );
    }
  } else if (scRegex.test(url)) {
    const songInfo = await scdl.getInfo(url);
    const song = {
      service: "sc",
      title: songInfo.title ?? "Unknown title",
      url: songInfo.permalink_url ?? "https://soundcloud.com",
      user: message.author.username,
      thumbnail: songInfo.artwork_url ?? "",
      length: (songInfo.full_duration ?? 0) / 1000, // this api returns ms
    };
    queuedSongs.push(song);
  } else if (globalUrlRegex.test(url)) {
    message.channel.send(
      "I don't recognize this URL. Supported services are YouTube and SoundCloud!"
    );
  } else {
    // treat as yt search query
    const query = args.slice(1).join(" ");
    if (query.length > 0) {
      const searchResult = await youtube.searchVideos(query);
      const song = {
        service: "yt",
        title: searchResult.title,
        url: searchResult.url,
        length: searchResult.durationSeconds,
        thumbnail: searchResult.thumbnail,
        user: message.author.username,
      };
      queuedSongs.push(song);
    } else {
      return message.channel.send(
        "Enter a YouTube URL or search term to play a track."
      );
    }
  }

  if (!guildQueue) {
    // create queue for this guild
    const newGuildQueue: Queue = {
      textChannel: message.channel as Discord.TextChannel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: defaultVolume,
      playing: true,
    };

    if (message.guild) {
      globalQueues.set(message.guild.id, newGuildQueue);
      console.log(
        `New guild queue created for ${newGuildQueue.voiceChannel.id}`
      );
      console.log(
        `[${newGuildQueue.voiceChannel.id}] [${message.author.username}] Added songs to the queue`
      );
      newGuildQueue.songs.push(...queuedSongs);
    }

    try {
      var connection = await voiceChannel.join();
      newGuildQueue.connection = connection;
      if (message.guild) {
        play(message.guild, newGuildQueue.songs[0], globalQueues);
      }
    } catch (err) {
      console.log(err);
      if (message.guild !== null) {
        globalQueues.delete(message.guild.id);
      }
      return message.channel.send(err);
    }
  } else {
    console.log(
      `[${guildQueue.voiceChannel.id}] [${message.author.username}] Added ${queuedSongs.length} songs to the queue`
    );
    guildQueue.songs.push(...queuedSongs);
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
