/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  getExistingVoiceConnection,
  createVoiceConnection,
} from "../lib/connection";
import { getNowPlayingEmbed } from "../lib/embeds";
import { log } from "../lib/logger";
import { destroyQueue } from "../lib/queue";
import { createYoutubeTrackResource } from "../lib/services/youtube";
import { shuffleArray } from "../lib/util";
import {
  AudioPlayer,
  AudioPlayerStatus,
  createAudioPlayer,
  PlayerSubscription,
} from "@discordjs/voice";
import { TextBasedChannel, VoiceBasedChannel } from "discord.js";
import { EventEmitter } from "stream";

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

export class Queue extends EventEmitter {
  tracks: QueuedTrack[];
  voiceChannel: VoiceBasedChannel;
  textChannel: TextBasedChannel | null;
  audioPlayer: AudioPlayer;
  currentIndex: number;
  isPlaying: boolean;
  subscription: PlayerSubscription | undefined;

  constructor(
    voiceChannel: VoiceBasedChannel,
    textChannel: TextBasedChannel | null
  ) {
    super();
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
  }

  add(track: QueuedTrack, next = false) {
    if (next) {
      this.tracks.splice(this.currentIndex + 1, 0, track);
    } else {
      this.tracks.push(track);
    }
  }

  remove(idx: number) {
    return this.tracks.splice(idx, 1);
  }

  async play() {
    try {
      this.isPlaying = true;
      const resource = await createYoutubeTrackResource(this.nowPlaying);
      this.audioPlayer.play(resource);
      if (!this.subscription) {
        this.connection.subscribe(this.audioPlayer);
      }
      // send embed in the registered text channel
      if (this.textChannel) {
        const nowPlayingEmbed = getNowPlayingEmbed(
          this.nowPlaying,
          this.currentIndex + 1,
          this.tracks.length
        );
        //@ts-ignore
        this.textChannel.send({ embeds: [nowPlayingEmbed] });
      }
      log({
        type: "INFO",
        user: "BOT",
        guildId: this.guildId,
        message: `Playing ${this.nowPlaying.url}`,
      });
      return this.nowPlaying;
    } catch (err) {
      console.error(err);
    }
  }

  async stop() {
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

  get nowPlaying() {
    return this.tracks[this.currentIndex];
  }

  get guildId() {
    return this.voiceChannel.guildId;
  }
}
