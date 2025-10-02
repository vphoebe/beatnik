import type { AudioPlayer, PlayerSubscription } from "@discordjs/voice";
import { AudioPlayerStatus, createAudioPlayer } from "@discordjs/voice";
import type { CommandInteraction, TextBasedChannel, VoiceBasedChannel } from "discord.js";

import { allGuildQueues } from "../beatnik";
import { createVoiceConnection, getExistingVoiceConnection } from "./connection";
import { getNowPlayingEmbed } from "./messaging";

import type { YtApiTrack } from "@engine/youtube/metadata";
import { getMetadataFromQuery } from "@engine/youtube/metadata";
import { createResource } from "@engine/youtube/stream";

import { log } from "@helpers/logger";

export interface QueuedTrack extends YtApiTrack {
  addedBy: string;
}

function shuffleArray<T>(array: T[]) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = newArray[i];
    newArray[i] = newArray[j];
    newArray[j] = temp;
  }
  return newArray;
}

function getVoiceChannelFromInteraction(interaction: CommandInteraction) {
  const requestingUserId = interaction.user.id;
  const requestingMember = interaction.guild?.members.cache.get(requestingUserId);
  if (!requestingMember) throw new Error("No guild member found for this user.");
  return requestingMember.voice.channel;
}

export async function getOrCreateQueue(interaction: CommandInteraction): Promise<Queue> {
  const guildId = interaction.guildId;
  if (!guildId) {
    throw new Error("Unable to find your guild ID. Are you in a server?");
  }
  const existingQueue = allGuildQueues.has(guildId);
  let queue: Queue;
  if (existingQueue) {
    queue = allGuildQueues.get(guildId) as Queue;
  } else {
    const voiceChannel = getVoiceChannelFromInteraction(interaction);
    if (!voiceChannel) {
      throw new Error("Please join a voice channel to control the music!");
    }
    allGuildQueues.set(guildId, new Queue(voiceChannel, interaction.channel));
    queue = allGuildQueues.get(guildId) as Queue;
  }
  return queue;
}

export async function getExistingQueue(
  interaction: CommandInteraction,
): Promise<Queue | undefined> {
  const guildId = interaction.guildId;
  if (!guildId) {
    throw new Error("Unable to find your guild ID. Are you in a server?");
  }
  const voiceChannel = getVoiceChannelFromInteraction(interaction);
  if (!voiceChannel) {
    throw new Error("Please join a voice channel to control the music!");
  }
  return allGuildQueues.get(guildId);
}

export class Queue {
  tracks: QueuedTrack[];
  voiceChannel: VoiceBasedChannel;
  textChannel: TextBasedChannel | null;
  audioPlayer: AudioPlayer;
  currentIndex: number;
  isPlaying: boolean;
  playingFromCache: boolean | null;
  subscription: PlayerSubscription | undefined;

  constructor(voiceChannel: VoiceBasedChannel, textChannel: TextBasedChannel | null) {
    this.tracks = [];
    this.currentIndex = 0;
    this.audioPlayer = createAudioPlayer()
      .on(AudioPlayerStatus.Idle, () => {
        if (this.tracks.length - 1 > this.currentIndex) {
          this.next();
        } else {
          this.stop();
          if (textChannel?.isSendable()) {
            textChannel?.send(":wave: Nothing left in the queue!");
          }
        }
      })
      .on("error", (err) => {
        log({
          type: "ERROR",
          user: "BOT",
          message: `Error playing! Error was:`,
        });
        console.error(err);
        if (this.textChannel?.isSendable()) {
          this.textChannel?.send(
            `There was a problem with ${this.nowPlaying?.title ?? ""}, skipping...`,
          );
        }
        this.next();
      });
    this.isPlaying = false;
    this.voiceChannel = voiceChannel;
    this.textChannel = textChannel;
    this.playingFromCache = null;
  }

  async enqueue(query: string, userId: string, shuffle = false, end = false) {
    const data = await getMetadataFromQuery(query, { useLibrary: true });
    let tracks = data?.playlist ? data.playlist.tracks : data?.track ? [data.track] : [];
    if (shuffle) {
      tracks = shuffleArray(tracks);
    }
    const basis = end ? this.tracks.length : this.currentIndex + 1;
    tracks.forEach((t, idx) => this.insert({ ...t, addedBy: userId }, basis + idx));
    return tracks;
  }

  async play() {
    try {
      // next/jump methods set currentIndex, which is used in nowPlaying getter
      const trackToPlay = this.nowPlaying;
      if (!trackToPlay) {
        return this.stop();
      }
      const { resource, fromCache } = await createResource(trackToPlay);
      this.audioPlayer.play(resource);
      this.isPlaying = true;
      this.playingFromCache = fromCache;
      if (!this.subscription) {
        this.connection.subscribe(this.audioPlayer);
      }
      // send embed in the registered text channel
      if (this.textChannel && this.textChannel.isSendable()) {
        const nowPlayingEmbed = getNowPlayingEmbed(
          trackToPlay,
          this.currentIndex + 1,
          this.tracks.length,
          this.playingFromCache,
        );
        this.textChannel.send({ embeds: [nowPlayingEmbed] });
      }
      log({
        type: "INFO",
        user: "BOT",
        message: `Playing ${trackToPlay.id} ${fromCache ? "from cache" : "from URL"}`,
      });
      return this.nowPlaying;
    } catch (err) {
      log({
        type: "ERROR",
        user: "BOT",
        message: `Error playing! Error was:`,
      });
      console.error(err);
      if (this.textChannel?.isSendable()) {
        this.textChannel?.send(
          `Unable to play ${this.nowPlaying?.id ?? "[no track found]"}, skipping...`,
        );
      }
      await this.next();
    }
  }

  async stop() {
    this.audioPlayer.stop();
    this.connection.destroy();
    this.subscription?.unsubscribe();
    allGuildQueues.delete(this.guildId);
  }

  async next() {
    this.currentIndex++;
    await this.play();
  }

  async jump(idx: number) {
    this.currentIndex = idx;
    await this.play();
  }

  insert(track: QueuedTrack, start: number) {
    this.tracks.splice(start, 0, track);
  }

  remove(idx: number) {
    return this.tracks.splice(idx, 1);
  }

  shuffle() {
    const before = this.tracks.slice(0, this.currentIndex + 1);
    const after = this.tracks.slice(this.currentIndex + 2);
    const shuffled = shuffleArray(after);
    this.tracks = [...before, ...shuffled];
  }

  getPage(pageNumber: number) {
    // return 10 tracks corresponding to the page number
    const zeroIndexPageNumber = pageNumber - 1;
    if (zeroIndexPageNumber > this.pages - 1) {
      return null;
    }
    const pagedTracks = [...this.tracks].slice(
      zeroIndexPageNumber * 10,
      zeroIndexPageNumber * 10 + 10,
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
