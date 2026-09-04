import type { Provider, ProviderPlaylist, ProviderTrack } from "@/providers";
import { log } from "@/shared";
import type { Readable } from "node:stream";

import { getDownloadedIdStream } from "./cache/disk";
import { playlists } from "./db/playlist";
import { tracks } from "./db/track";
import { providers } from "./manager";

interface ResolveResultBase {
  provider: Provider;
  resolvedQuery: string;
}

type ResolveResult =
  | (ResolveResultBase & { type: "track"; metadata: ProviderTrack | null })
  | (ResolveResultBase & { type: "playlist"; metadata: ProviderPlaylist | null })
  | (ResolveResultBase & { type: "search"; metadata: ProviderTrack | null });

interface StreamResult {
  stream: Readable;
  fromCache: boolean;
}

async function resolveTrackMetadata(id: string, provider: Provider): Promise<ProviderTrack | null> {
  // prefer database metadata, then provider method
  const dbTrack = tracks.get(id);
  if (dbTrack) {
    return {
      ...dbTrack,
      providerId: provider.id,
    };
  }
  return provider.getTrack(id);
}

async function resolvePlaylistMetadata(
  id: string,
  provider: Provider,
): Promise<ProviderPlaylist | null> {
  // prefer database metadata, then provider method
  const dbPlaylist = playlists.getTracks(id);
  if (dbPlaylist) {
    const tracksWithProviderId: ProviderTrack[] = dbPlaylist.tracks.map((t) => ({
      ...t,
      providerId: provider.id,
    }));
    return { ...dbPlaylist, tracks: tracksWithProviderId };
  }
  return provider.getPlaylist(id);
}

export async function resolveStream(id: string, provider: Provider): Promise<StreamResult> {
  // prefer disk cache, then provider method
  const cached = getDownloadedIdStream(id);
  if (cached) {
    return { stream: cached, fromCache: true };
  }
  try {
    const stream = await provider.getStream(id)
    return { stream, fromCache: false };
  } catch (err) {
    log({ level: "ERROR", message: `${err}`, component: "CORE", name: "PLAYER" })
    throw new Error("Unable to get provider stream")
  }
}

export async function resolveTrackLoudness(
  track: ProviderTrack,
  provider: Provider,
): Promise<number | null> {
  const cached = tracks.get(track.id);
  if (cached && cached.loudness !== null) return cached.loudness;

  const metadata = await provider.getTrack(track.id);
  if (metadata && metadata.loudness !== null) {
    // save the loudness info to the db, only if track exists
    tracks.update(track.id, { loudness: metadata.loudness });
    return metadata.loudness;
  }
  log({
    level: "WARN",
    component: "CORE",
    name: "PLAYER",
    message: `Unable to resolve loudness data for ${provider.id}:${track.id}.`,
  });
  return null;
}

/**
 * Resolves an arbitrary query against the first matching provider.
 * @param input - A URL or search query string.
 * @param returnMetadata - Whether to return resolved metadata against database + provider.
 * @returns The resolved query (such as a parsed ID from a URL), along with the metadata and matched {@link Provider}.
 */
export async function resolveQuery(input: string, returnMetadata = true): Promise<ResolveResult> {
  for (const provider of providers) {
    const resolution = await provider.resolve(input);
    if (!resolution) continue;
    const { resolvedQuery, type } = resolution;
    switch (type) {
      case "track":
        return {
          metadata: returnMetadata ? await resolveTrackMetadata(resolvedQuery, provider) : null,
          type,
          resolvedQuery,
          provider,
        };
      case "playlist":
        return {
          metadata: returnMetadata ? await resolvePlaylistMetadata(resolvedQuery, provider) : null,
          type,
          resolvedQuery,
          provider,
        };
      case "search":
        return {
          metadata: returnMetadata ? ((await provider.search?.(resolvedQuery)) ?? null) : null,
          type,
          resolvedQuery,
          provider,
        };
    }
  }
  throw new Error(`No source could handle: ${input}`);
}
