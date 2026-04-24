import { deleteSession } from "@/core/manager";
import type { CorePlayer } from "@/core/player";
import { log } from "@/shared";
import type { PlayerSubscription, VoiceConnection } from "@discordjs/voice";
import {
  AudioPlayerStatus,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  demuxProbe,
  entersState,
} from "@discordjs/voice";
import type { TextBasedChannel, VoiceBasedChannel } from "discord.js";

import { createVoiceConnection } from "./connection";
import { deleteVoiceSession } from "./manager";
import { getNowPlayingEmbed } from "./messaging";

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
      await entersState(this.connection, VoiceConnectionStatus.Ready, 10_000);
      const { stream, type } = await demuxProbe(inputStream);
      const resource = createAudioResource(stream, {
        inputType: type,
        inlineVolume: true,
      });
      const decibels = -(track.loudness ?? 0);
      resource.volume?.setVolumeDecibels(decibels);
      this.audioPlayer.play(resource);

      const operator = decibels >= 0 ? "+" : "";
      log({
        component: "DISCORD",
        name: "VoiceSession",
        message: `Playing resource, adjusted loudness ${operator}${decibels}dB`,
      });

      // send embed in textchannel
      if (this.textChannel && this.textChannel.isSendable() && corePlayer.queue.nowPlaying) {
        const nowPlayingEmbed = getNowPlayingEmbed(
          corePlayer.queue.nowPlaying,
          corePlayer.queue.currentIndex + 1,
          corePlayer.queue.tracks.length,
          corePlayer.fromCache,
        );
        this.textChannel.send({ embeds: [nowPlayingEmbed] });
      }
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
      const track = corePlayer.queue.nowPlaying;
      if (track) corePlayer.onError?.(track, err);
    });
  }

  destroy() {
    this.subscription?.unsubscribe();
    this.connection.destroy();
  }
}
