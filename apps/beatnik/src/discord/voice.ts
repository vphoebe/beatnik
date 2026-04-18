import {
  AudioPlayerStatus,
  type PlayerSubscription,
  type VoiceConnection,
  createAudioPlayer,
  createAudioResource,
  demuxProbe,
} from "@discordjs/voice";
import { type TextBasedChannel, type VoiceBasedChannel } from "discord.js";

import { deleteSession } from "../core/manager";
import { type CorePlayer } from "../core/player";
import { createVoiceConnection } from "./connection";
import { deleteVoiceSession } from "./manager";

export class VoiceSession {
  private guildId: string;
  private textChannel: TextBasedChannel | null;
  private audioPlayer = createAudioPlayer();
  private subscription?: PlayerSubscription;
  private connection: VoiceConnection;

  constructor(
    voiceChannel: VoiceBasedChannel,
    textChannel: TextBasedChannel | null,
    corePlayer: CorePlayer,
  ) {
    this.guildId = voiceChannel.guildId;
    this.textChannel = textChannel;
    this.connection = createVoiceConnection(voiceChannel);
    this.subscription = this.connection.subscribe(this.audioPlayer);

    corePlayer.onStream = async (track, inputStream) => {
      const { stream, type } = await demuxProbe(inputStream);
      const resource = createAudioResource(stream, {
        inputType: type,
        metadata: {
          title: track.title,
        },
        inlineVolume: true,
      });
      const decibels = -(track.loudness ?? 0);
      resource.volume?.setVolumeDecibels(decibels);
      this.audioPlayer.play(resource);
    };

    corePlayer.onQueueEnd = () => {
      if (this.textChannel?.isSendable()) {
        this.textChannel.send(":wave: Nothing left in the queue!");
      }
      deleteVoiceSession(this.guildId);
      deleteSession(this.guildId);
    };

    corePlayer.onStop = () => {
      deleteVoiceSession(this.guildId);
      deleteSession(this.guildId);
    };

    this.audioPlayer.on(AudioPlayerStatus.Idle, () => corePlayer.next());
    this.audioPlayer.on("error", (err) => {
      const track = corePlayer.nowPlaying;
      if (track) corePlayer.onError?.(track, err);
    });
  }

  destroy() {
    this.subscription?.unsubscribe();
    this.connection.destroy();
  }
}
