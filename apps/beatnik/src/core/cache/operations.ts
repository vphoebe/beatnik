import type { Provider, ProviderPlaylist, ProviderTrack } from "@beatnik/providers";
import { log } from "@beatnik/shared";

import { playlists } from "../db/playlist";
import { tracks } from "../db/track";
import { providers } from "../manager";
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
    };
  }
  tracks.create({ ...track, playlistId: null, playlistIdx: null });
  const stream = await provider.getStream(track.id);
  await downloadToCache(track.id, stream);
  return {
    added: true,
    updated: false,
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
): Promise<LibraryOperationResult> {
  const playlistExists = playlists.exists(playlistData.id);
  if (playlistExists) {
    playlists.update(playlistData);
  } else {
    playlists.create(playlistData);
  }
  await downloadPlaylist(playlistData, provider);
  return {
    added: !playlistExists,
    updated: playlistExists,
  };
}

export async function updatePlaylistInLibrary(playlistIntId: number) {
  const existingPlaylistData = playlists.getInfo(playlistIntId);
  if (!existingPlaylistData) return;

  // TEMP/TODO: store providerId on the playlistData and use that here
  const provider = providers.find((p) => p.id === "youtube");
  if (!provider) throw new Error(`No provider found for source (TEMP)`);

  const queryResult = await provider.getPlaylist(existingPlaylistData.url);
  if (!queryResult) return;

  return {
    operation: await addPlaylistToLibrary(queryResult, provider),
    playlistData: queryResult,
  };
}

export async function deletePlaylistFromLibrary(playlist_int_id: number) {
  const trackRecords = tracks.inPlaylist(playlist_int_id);
  const rmPromises = trackRecords.map((t) => removeDownload(t.id));
  await Promise.all(rmPromises);

  return playlists.delete(playlist_int_id);
}
