import type { CorePlayer } from "@/core/player";
import type { TextBasedChannel, VoiceBasedChannel } from "discord.js";

import { VoiceSession } from "./voice";

const voiceSessions = new Map<string, VoiceSession>();

export function getOrCreateVoiceSession(
  voiceChannel: VoiceBasedChannel,
  textChannel: TextBasedChannel | null,
  corePlayer: CorePlayer,
): VoiceSession {
  const { guildId } = voiceChannel;
  let session = voiceSessions.get(guildId);
  if (!session) {
    session = new VoiceSession(voiceChannel, textChannel, corePlayer);
    voiceSessions.set(guildId, session);
  }
  return session;
}

export function deleteVoiceSession(guildId: string) {
  voiceSessions.get(guildId)?.destroy();
  voiceSessions.delete(guildId);
}
