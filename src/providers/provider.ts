import type { Readable } from "node:stream";

export type QueryType = "track" | "playlist" | "search";

export interface ProviderTrack {
  providerId: string;
  id: string;
  url: string;
  title: string;
  thumbnailUrl: string;
  channelName: string;
  length: number;
  loudness: number | null;
  playlistIdx: number | null;
}

export interface ProviderPlaylist {
  providerId: string;
  id: string;
  url: string;
  title: string;
  authorName: string;
  tracks: ProviderTrack[];
}

export interface ResolvedQuery {
  type: QueryType;
  resolvedQuery: string;
}

export interface Provider {
  id: string;

  /**
   * Determines whether this provider can handle the given input and classifies its type.
   * @param query - An unknown input query, could be a URL or search query string.
   * @returns The query type and resolved query, or null if this provider cannot handle the input.
   * `resolvedQuery` may differ from `input`, for example, a YouTube URL will be resolved to its
   * video/playlist ID for direct use in subsequent provider operations.
   */
  resolve: (query: string) => Promise<ResolvedQuery | null>;

  /**
   * Fetches metadata for a single track.
   * @param resolvedQuery - The resolved query string from {@link Provider.resolve}.
   */
  getTrack: (resolvedQuery: string) => Promise<ProviderTrack | null>;

  /**
   * Fetches metadata for a playlist including its tracks.
   * @param resolvedQuery - The resolved query string from {@link Provider.resolve}.
   */
  getPlaylist: (resolvedQuery: string) => Promise<ProviderPlaylist | null>;

  getStream: (uniqueId: string) => Promise<Readable>;
  search?: (query: string) => Promise<ProviderTrack | null>;
}
