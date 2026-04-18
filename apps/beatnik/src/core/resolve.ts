import { type Provider, type ProviderPlaylist, type ProviderTrack } from "@beatnik/providers";
import type { Readable } from "node:stream";

import { getDownloadedIdStream } from "./cache/disk";
import { playlists } from "./db/playlist";
import { tracks } from "./db/track";
import { providers } from "./manager";

interface ResolveResultBase {
  provider: Provider;
  resolvedQuery: string;
}

export type ResolveResult =
  | (ResolveResultBase & { type: "track"; metadata: ProviderTrack | null })
  | (ResolveResultBase & { type: "playlist"; metadata: ProviderPlaylist | null })
  | (ResolveResultBase & { type: "search"; metadata: ProviderTrack | null });

interface StreamResult {
  stream: Readable;
  fromCache: boolean;
}

export async function getStream(id: string, provider: Provider): Promise<StreamResult> {
  // prefer disk cache, then provider method
  const cached = getDownloadedIdStream(id);
  if (cached) {
    return { stream: cached, fromCache: true };
  }
  return { stream: await provider.getStream(id), fromCache: false };
}

export async function getTrack(id: string, provider: Provider): Promise<ProviderTrack | null> {
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

export async function getPlaylist(
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

/**
 * Resolves an arbitrary query against the first matching provider.
 * @param input - A URL or search query string.
 * @returns The resolved query (such as a parsed ID from a URL), along with the metadata and matched {@link Provider}.
 */
export async function agnosticResolve(input: string): Promise<ResolveResult> {
  for (const provider of providers) {
    const resolution = await provider.resolve(input);
    if (!resolution) continue;
    const { resolvedQuery, type } = resolution;
    switch (type) {
      case "track":
        return {
          metadata: await getTrack(resolvedQuery, provider),
          type,
          resolvedQuery,
          provider,
        };
      case "playlist":
        return {
          metadata: await getPlaylist(resolvedQuery, provider),
          type,
          resolvedQuery,
          provider,
        };
      case "search":
        return {
          metadata: (await provider.search?.(resolvedQuery)) ?? null,
          type,
          resolvedQuery,
          provider,
        };
    }
  }
  throw new Error(`No source could handle: ${input}`);
}
