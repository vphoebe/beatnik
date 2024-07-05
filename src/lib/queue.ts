import {
  AudioPlayer,
  AudioPlayerStatus,
  createAudioPlayer,
  PlayerSubscription,
} from "@discordjs/voice";
import {
  CommandInteraction,
  TextBasedChannel,
  VoiceBasedChannel,
} from "discord.js";
import {
  getExistingVoiceConnection,
  createVoiceConnection,
} from "../lib/connection.js";
import { getNowPlayingEmbed } from "../lib/embeds.js";
import { log } from "../lib/logger.js";
import { shuffleArray } from "../lib/util.js";
import {
  createYoutubeTrackResource,
  parsedQueryToYoutubeQueuedTracks,
} from "../lib/yt.js";
import { parsePlayQuery } from "../lib/yt.js";

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
  loudness?: number;
};

export const allGuildQueues = new Map<string, Queue>();

function getVoiceChannelFromInteraction(interaction: CommandInteraction) {
  const requestingUserId = interaction.user.id;
  const requestingMember =
    interaction.guild?.members.cache.get(requestingUserId);
  if (!requestingMember)
    throw new Error("No guild member found for this user.");
  return requestingMember.voice.channel;
}

export async function getOrCreateQueue(
  interaction: CommandInteraction,
): Promise<Queue> {
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

class Queue {
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
    textChannel: TextBasedChannel | null,
  ) {
    this.tracks = [];
    this.currentIndex = 0;
    this.audioPlayer = createAudioPlayer().on(AudioPlayerStatus.Idle, () => {
      if (this.tracks.length - 1 > this.currentIndex) {
        this.next();
      } else {
        this.stop();
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

  async addByQuery(
    query: string,
    userId: string,
    shuffle = false,
    end = false,
  ) {
    const parsedQuery = await parsePlayQuery(query);
    let tracks = await parsedQueryToYoutubeQueuedTracks(parsedQuery, userId);
    if (shuffle) {
      tracks = shuffleArray(tracks);
    }
    const basis = end ? this.tracks.length : this.currentIndex + 1;
    tracks.forEach((t, idx) => this.add(t, basis + idx));
    return tracks.length;
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
      const { resource, fromCache } =
        await createYoutubeTrackResource(trackToPlay);
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
          this.playingFromCache,
        );
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
      this.textChannel?.send(
        `Unable to play ${
          this.nowPlaying?.id ?? "[no track found]"
        }, skipping...`,
      );
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
