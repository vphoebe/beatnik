import Discord from "discord.js";
import { Queue, GlobalQueues, PlaylistSong } from "../types";
import ytdl from "discord-ytdl-core";
import getDurationString from "../util/duration";
const scdl = require("soundcloud-downloader").default;

export function skip(message: Discord.Message, guildQueue: Queue) {
  if (!message.member?.voice.channel ?? false)
    return message.channel.send(
      "You have to be in a voice channel to control the music."
    );
  if (!guildQueue)
    return message.channel.send("There is no song that I could skip!");
  console.log(`[${guildQueue.voiceChannel.id}] Skipping current track`);
  guildQueue.connection?.dispatcher.end();
}

export function stop(message: Discord.Message, guildQueue: Queue) {
  if (!message.member?.voice.channel ?? false)
    return message.channel.send(
      "You have to be in a voice channel to control the music."
    );

  if (!guildQueue) return message.channel.send("Nothing is playing right now.");

  if (!guildQueue.connection) return;
  if (!guildQueue.connection.dispatcher) return;

  console.log(`[${guildQueue.voiceChannel.id}] Stopping`);
  guildQueue.songs = [];
  guildQueue.connection.dispatcher.end();
}

export async function play(
  guild: Discord.Guild,
  song: PlaylistSong,
  GlobalQueues: GlobalQueues
) {
  const guildQueue = GlobalQueues.get(guild.id);
  if (!guildQueue) {
    return;
  }
  if (!song) {
    guildQueue.voiceChannel.leave();
    GlobalQueues.delete(guild.id);
    return;
  }

  let streamSource;

  const ffmpegArgs = ["-af", "dynaudnorm=g=101:m=5"];

  if (song.service === "yt") {
    streamSource = ytdl(song.url, {
      filter: "audioonly",
      opusEncoded: true,
      encoderArgs: ffmpegArgs,
    });
  } else if (song.service === "sc") {
    streamSource = ytdl.arbitraryStream(scdl.download(song.url), {
      opusEncoded: true,
      encoderArgs: ffmpegArgs,
    });
  } else {
    streamSource = "";
  }

  const dispatcher = guildQueue.connection
    ?.play(streamSource, { type: "opus" })
    .on("start", () =>
      console.log(`[${guildQueue.voiceChannel.id}] Now playing ${song.url}`)
    )
    .on("finish", () => {
      guildQueue.songs.shift();
      play(guild, guildQueue.songs[0], GlobalQueues);
    })
    .on("error", (error) => {
      console.error(`An error occurred for ${song.url}`);
      console.error(error);
      if (error.message.includes("Music Premium")) {
        guildQueue.textChannel.send(
          `**${song.title}** can't be played, as it's only available for Music Premium members. Skipping...`
        );
      } else {
        guildQueue.textChannel.send(
          `**${song.title}** can't be played, skipping...`
        );
      }
      guildQueue.songs.shift();
      play(guild, guildQueue.songs[0], GlobalQueues);
    });
  dispatcher?.setVolume(guildQueue.volume);
  const nowPlayingEmbed = new Discord.MessageEmbed()
    .setAuthor("Now playing...")
    .setColor("#ed872d")
    .setTitle(song.title)
    .addField("Duration", getDurationString(song.length), true)
    .addField("Queued by", song.user, true)
    .addField("Service", song.service === "yt" ? "YouTube" : "SoundCloud")
    .setThumbnail(song.thumbnail ?? "")
    .setURL(song.url);
  guildQueue.textChannel.send(nowPlayingEmbed);
}
