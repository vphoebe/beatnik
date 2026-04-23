import { createReadStream } from "node:fs";
import { join } from "node:path";
import type { Readable } from "node:stream";
import { fileURLToPath } from "node:url";

import type { Provider, ProviderPlaylist, ProviderTrack, ResolvedQuery } from "../provider";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getMockTracks(length: number): ProviderTrack[] {
  return Array.from({ length }).map((_, idx) => ({
    providerId: "mock",
    id: `mock_track_${idx}`,
    url: `https://mock.provider/watch?v=mock_track_${idx}`,
    title: `Mock Track ${idx}`,
    thumbnailUrl: "https://mock.provider/thumb/mock_track.jpg",
    channelName: "Mock Artist",
    length: 5,
    loudness: 4.2,
    playlistIdx: null,
  }));
}

const MOCK_TRACKS = getMockTracks(4);

const MOCK_PLAYLIST: ProviderPlaylist = {
  providerId: "mock",
  id: "mock_playlist_001",
  url: "https://mock.provider/playlist?list=mock_playlist_001",
  title: "Mock Playlist",
  authorName: "Mock Curator",
  tracks: getMockTracks(25).map((t, idx) => ({ ...t, playlistIdx: idx })),
};

export class MockProvider implements Provider {
  readonly id = "mock";

  async resolve(query: string): Promise<ResolvedQuery | null> {
    await sleep(80);

    if (query.includes("mock.provider/playlist")) {
      const id = new URL(query).searchParams.get("list");
      return id ? { type: "playlist", resolvedQuery: id } : null;
    }

    if (query.includes("mock.provider/watch")) {
      const id = new URL(query).searchParams.get("v");
      return id ? { type: "track", resolvedQuery: id } : null;
    }

    if (query.startsWith("mock:")) {
      // direct id passthrough e.g. "mock:mock_track_001"
      return { type: "track", resolvedQuery: query.slice(5) };
    }

    // treat anything else as a search query
    return null;
  }

  async getTrack(resolvedQuery: string): Promise<ProviderTrack | null> {
    await sleep(120);
    return MOCK_TRACKS.find((t) => t.id === resolvedQuery) ?? null;
  }

  async getPlaylist(resolvedQuery: string): Promise<ProviderPlaylist | null> {
    await sleep(350);
    return MOCK_PLAYLIST.id === resolvedQuery ? MOCK_PLAYLIST : null;
  }

  async getStream(_uniqueId: string): Promise<Readable> {
    await sleep(Math.floor(Math.random() * 3000) + 1000);
    const __dirname = fileURLToPath(new URL(".", import.meta.url));
    return createReadStream(join(__dirname, "tone.opus"));
  }
}
