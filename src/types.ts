import Discord from "discord.js";

export type PlaylistSong = {
  service: string;
  title: string;
  url: string;
  user: string;
  thumbnail: string | null;
  length: number | null;
};

export type Queue =
  | {
      textChannel: Discord.TextChannel;
      voiceChannel: Discord.VoiceChannel;
      connection: Discord.VoiceConnection | null;
      songs: PlaylistSong[];
      volume: number;
      playing: boolean;
    }
  | undefined; // queue is not instantiated until playback

export type GlobalQueues = Map<String, Queue>;
