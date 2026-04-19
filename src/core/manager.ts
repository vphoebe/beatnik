import type { Provider } from "@/providers";
import { YoutubeProvider } from "@/providers";

import { config } from "./config";
import { CorePlayer } from "./player";
import { Queue } from "./queue";

interface GuildSession {
  queue: Queue;
  player: CorePlayer;
}

const sessions = new Map<string, GuildSession>();

export const providers: Provider[] = [await YoutubeProvider.create(config.youtube)];

export function getOrCreateSession(guildId: string): GuildSession {
  let session = sessions.get(guildId);
  if (!session) {
    const queue = new Queue();
    const player = new CorePlayer(queue, providers);
    session = { queue, player };
    sessions.set(guildId, session);
  }
  return session;
}

export function deleteSession(guildId: string) {
  sessions.delete(guildId);
}

export function getSession(guildId: string): GuildSession | undefined {
  return sessions.get(guildId);
}
