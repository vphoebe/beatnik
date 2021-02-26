import Discord from "discord.js";
import { Queue, BotQueue, PlaylistSong } from "../types";
import ytdl from "ytdl-core";

export function skip(message: Discord.Message, serverQueue: Queue) {
  if (!message.member?.voice.channel ?? false)
    return message.channel.send(
      "You have to be in a voice channel to stop the music!"
    );
  if (!serverQueue)
    return message.channel.send("There is no song that I could skip!");
  serverQueue.connection?.dispatcher.end();
}

export function stop(message: Discord.Message, serverQueue: Queue) {
  if (!message.member?.voice.channel ?? false)
    return message.channel.send(
      "You have to be in a voice channel to stop the music!"
    );

  if (!serverQueue)
    return message.channel.send("There is no song that I could stop!");

  serverQueue.songs = [];
  serverQueue.connection?.dispatcher.end();
}

export function play(
  guild: Discord.Guild,
  song: PlaylistSong,
  botQueue: BotQueue
) {
  const serverQueue = botQueue.get(guild.id);
  if (!serverQueue) {
    return;
  }
  if (!song) {
    serverQueue.voiceChannel.leave();
    botQueue.delete(guild.id);
    return;
  }

  const dispatcher = serverQueue.connection
    ?.play(
      ytdl(song.url, {
        quality: "highestaudio",
        filter: (format) => format.container === "mp4",
      })
    )
    .on("finish", () => {
      serverQueue.songs.shift();
      play(guild, serverQueue.songs[0], botQueue);
    })
    .on("error", (error) => console.error(error));
  dispatcher?.setVolume(serverQueue.volume);
  serverQueue.textChannel.send(`Now playing: **${song.title}**`);
}
