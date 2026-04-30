import type { Provider } from "@/providers";
import { MockProvider, YoutubeProvider } from "@/providers";
import { log } from "@/shared";

import { config } from "./config";
import { CorePlayer } from "./player";
import { Queue } from "./queue";

interface GuildSession {
  queue: Queue;
  player: CorePlayer;
}

const sessions = new Map<string, GuildSession>();

export const providers: Provider[] = [];

export async function initProviders() {
  const youtubeProvider = await YoutubeProvider.create(config.youtube);
  providers.push(youtubeProvider);
  if (config.useMockProvider) {
    providers.unshift(new MockProvider());
  }
  log({
    component: "CORE",
    name: "PLAYER",
    message: `Initialized provider(s): ${providers.map((p) => p.id).join(", ")}`,
  });
}

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
