/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  getExistingVoiceConnection,
  createVoiceConnection,
} from "../lib/connection.js";
import { getNowPlayingEmbed } from "../lib/embeds.js";
import { log } from "../lib/logger.js";
import { destroyQueue } from "../lib/queue.js";
import { createYoutubeTrackResource } from "../lib/yt.js";
import { shuffleArray } from "../lib/util.js";
import {
  AudioPlayer,
  AudioPlayerStatus,
  createAudioPlayer,
  PlayerSubscription,
} from "@discordjs/voice";
import { TextBasedChannel, VoiceBasedChannel } from "discord.js";

export enum TrackService {
  YouTube = "yt",
}

export type QueuedTrack = {
  url: string;
  id: string;
  title: string;
  addedBy: string;
  service: TrackService;
  thumbnailImageUrl?: string;
  length: number;
  channel?: string;
};

export class Queue {
  tracks: QueuedTrack[];
  voiceChannel: VoiceBasedChannel;
  textChannel: TextBasedChannel | null;
  audioPlayer: AudioPlayer;
  currentIndex: number;
  isPlaying: boolean;
  playingFromCache: boolean | null;
  subscription: PlayerSubscription | undefined;

  constructor(
    voiceChannel: VoiceBasedChannel,
    textChannel: TextBasedChannel | null
  ) {
    this.tracks = [];
    this.currentIndex = 0;
    this.audioPlayer = createAudioPlayer().on(AudioPlayerStatus.Idle, () => {
      if (this.tracks.length - 1 > this.currentIndex) {
        this.next();
      } else {
        this.stop();
        //@ts-ignore
        textChannel?.send(":wave: Nothing left in the queue!");
      }
    });
    this.isPlaying = false;
    this.voiceChannel = voiceChannel;
    this.textChannel = textChannel;
    this.playingFromCache = null;
  }

  add(track: QueuedTrack, start: number) {
    this.tracks.splice(start, 0, track);
  }

  remove(idx: number) {
    return this.tracks.splice(idx, 1);
  }

  async play() {
    try {
      // next/jump methods set currentIndex, which is used in nowPlaying getter
      const trackToPlay = this.nowPlaying;
      if (!trackToPlay) {
        return this.stop();
      }
      const { resource, fromCache } = await createYoutubeTrackResource(
        trackToPlay
      );
      this.audioPlayer.play(resource);
      this.isPlaying = true;
      this.playingFromCache = fromCache;
      if (!this.subscription) {
        this.connection.subscribe(this.audioPlayer);
      }
      // send embed in the registered text channel
      if (this.textChannel) {
        const nowPlayingEmbed = getNowPlayingEmbed(
          trackToPlay,
          this.currentIndex + 1,
          this.tracks.length,
          this.playingFromCache
        );
        //@ts-ignore
        this.textChannel.send({ embeds: [nowPlayingEmbed] });
      }
      log({
        type: "INFO",
        user: "BOT",
        guildId: this.guildId,
        message: `Playing ${trackToPlay.id} ${
          fromCache ? "from cache" : "from URL"
        }`,
      });
      return this.nowPlaying;
    } catch (err) {
      log({
        type: "ERROR",
        user: "BOT",
        guildId: this.guildId,
        message: `Error playing! Error was:`,
      });
      console.error(err);
      //@ts-ignore
      this.textChannel.send(
        `Unable to play ${
          this.nowPlaying?.url ?? "[no track found]"
        }, skipping...`
      );
      await this.next();
    }
  }

  async stop() {
    this.audioPlayer.stop();
    this.connection.destroy();
    this.subscription?.unsubscribe();
    destroyQueue(this.guildId);
  }

  async next() {
    this.currentIndex++;
    await this.play();
  }

  async jump(idx: number) {
    this.currentIndex = idx;
    await this.play();
  }

  async shuffle() {
    const shuffledTracks = shuffleArray(this.tracks);
    this.tracks = shuffledTracks;
    this.currentIndex = 0;
    await this.play(); // play new shuffled queue starting from 0
  }

  getPage(pageNumber: number) {
    // return 10 tracks corresponding to the page number
    const zeroIndexPageNumber = pageNumber - 1;
    if (zeroIndexPageNumber > this.pages - 1) {
      return null;
    }
    const pagedTracks = [...this.tracks].slice(
      zeroIndexPageNumber * 10,
      zeroIndexPageNumber * 10 + 10
    );
    return pagedTracks;
  }

  get connection() {
    let connection = getExistingVoiceConnection(this.guildId);
    if (!connection) {
      connection = createVoiceConnection(this.voiceChannel);
    }
    return connection;
  }

  get pages() {
    return Math.ceil(this.tracks.length / 10);
  }

  get nowPlaying(): QueuedTrack | undefined {
    return this.tracks[this.currentIndex];
  }

  get guildId() {
    return this.voiceChannel.guildId;
  }
}
