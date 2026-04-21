import type { Provider, ProviderPlaylist, ProviderTrack } from "@/providers";
import { log } from "@/shared";

import { playlists } from "../db/playlist";
import { tracks } from "../db/track";
import { providers } from "../manager";
import { resolveQuery } from "../resolvers";
import {
  countCacheFiles,
  downloadPlaylist,
  downloadToCache,
  migrateCacheNames,
  removeDownload,
} from "./disk";

export interface LibraryOperationResult {
  added: boolean;
  updated?: boolean;
  error?: "EXISTS";
  diff: number;
}

export async function testLibraryConnection() {
  try {
    const migratedCacheCount = await migrateCacheNames();
    if (migratedCacheCount) {
      log({
        component: "CORE",
        name: "CACHE",
        message: `Migrated ${migratedCacheCount} files to new cache format`,
      });
    }
    const cacheCount = await countCacheFiles();
    log({
      component: "CORE",
      name: "CACHE",
      message: `Found ${cacheCount} cache files.`,
    });
    const playlistCount = playlists.count();
    const trackCount = tracks.count();
    log({
      component: "CORE",
      name: "DB",
      message: `Connected to library database! (${playlistCount} playlists, ${trackCount} tracks)`,
    });
  } catch (err) {
    console.error(err);
    process.exit();
  }
}

export async function addTrackToLibrary(
  track: ProviderTrack,
  provider: Provider,
): Promise<LibraryOperationResult> {
  // add track to db and save file
  const existingTrack = tracks.get(track.id);
  if (existingTrack) {
    return {
      added: false,
      updated: false,
      error: "EXISTS",
      diff: 0,
    };
  }
  tracks.create({ ...track, playlistId: null, playlistIdx: null });
  const stream = await provider.getStream(track.id);
  await downloadToCache(track.id, stream);
  return {
    added: true,
    updated: false,
    diff: 1,
  };
}

export async function deleteTrackFromLibrary(int_id: number) {
  const trackRecord = tracks.getInternal(int_id);
  if (!trackRecord) return;
  await removeDownload(trackRecord.id);
  tracks.delete(int_id);
  return { title: trackRecord.title };
}

export async function addPlaylistToLibrary(
  playlistData: ProviderPlaylist,
  provider: Provider,
  onProgress?: (track: ProviderTrack, index: number, total: number) => void,
): Promise<LibraryOperationResult> {
  const playlistExists = playlists.exists(playlistData.id);
  if (playlistExists) {
    playlists.update(playlistData);
  } else {
    playlists.create(playlistData);
  }
  const downloaded = await downloadPlaylist(playlistData, provider, onProgress);
  return {
    added: !playlistExists,
    updated: playlistExists,
    diff: downloaded,
  };
}

export async function updatePlaylistInLibrary(
  playlistIntId: number,
  onProgress?: (track: ProviderTrack, index: number, total: number) => void,
) {
  const existingPlaylistData = playlists.getInfo(playlistIntId);
  if (!existingPlaylistData) throw new Error(`${playlistIntId} Playlist does not exist`);

  const provider = providers.find((p) => p.id === existingPlaylistData.providerId);
  if (!provider) throw new Error(`No provider found for ${existingPlaylistData.providerId}`);

  // don't resolve metadata through resolver (would use DB)
  const query = await resolveQuery(existingPlaylistData.url, false);
  if (!query) throw new Error(`${existingPlaylistData.url} metadata was not found from provider.`);

  if (query.type !== "playlist")
    throw new Error(`Query ${existingPlaylistData.url} is not a playlist!`);

  const freshMetadata = await provider.getPlaylist(query.resolvedQuery);

  if (!freshMetadata)
    throw new Error(`${query.resolvedQuery} metadata was not found from provider.`);

  return {
    operation: await addPlaylistToLibrary(freshMetadata, provider, onProgress),
    playlistData: freshMetadata,
  };
}

export async function deletePlaylistFromLibrary(playlist_int_id: number) {
  const trackRecords = tracks.inPlaylist(playlist_int_id);
  const rmPromises = trackRecords.map((t) => removeDownload(t.id));
  await Promise.all(rmPromises);

  return playlists.delete(playlist_int_id);
}
