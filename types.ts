import Discord from "discord.js";

export type PlaylistSong = {
  title: string;
  url: string;
  user: string;
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

export type BotQueue = Map<String, Queue>;
