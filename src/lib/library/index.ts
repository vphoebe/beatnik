// tracks
import { ChatInputCommandInteraction } from "discord.js";

import { log } from "../logger.js";
import { getMetadataFromQuery, YtApiPlaylist, YtApiTrack } from "../youtube/metadata.js";
import {
  downloadId,
  downloadPlaylist,
  migrateCacheNames,
  removeDownload,
  testCache,
} from "./cache.js";
import { testDb } from "./db/client.js";
import {
  doesPlaylistExist,
  updateSavedPlaylist,
  savePlaylist,
  getPlaylist,
  deleteSavedPlaylist,
} from "./db/playlist.js";
import {
  getTrackByYtId,
  createTrack,
  getTrackByIntId,
  deleteTrack,
  getTracksByPlaylist,
} from "./db/track.js";

export interface LibraryOperationResult {
  added: boolean;
  updated?: boolean;
  error?: "EXISTS";
}

export async function testLibraryConnection() {
  try {
    testCache();
    log({
      type: "CACHE",
      user: "BOT",
      message: "Connected to library cache directory!",
    });
    const migratedCacheCount = await migrateCacheNames();
    if (migratedCacheCount) {
      log({
        type: "CACHE",
        user: "BOT",
        message: `Migrated ${migratedCacheCount} files to new cache format`,
      });
    }
    await testDb();
    log({
      type: "DB",
      user: "BOT",
      message: "Connected to library database!",
    });
  } catch (err) {
    console.error(err);
    process.exit();
  }
}

export async function addTrackToLibrary(track: YtApiTrack): Promise<LibraryOperationResult> {
  // add track to db and save file
  const existingTrack = await getTrackByYtId(track.id);
  if (existingTrack) {
    return {
      added: false,
      updated: false,
      error: "EXISTS",
    };
  }
  await createTrack(track);
  await downloadId(track.id);
  return {
    added: true,
    updated: false,
  };
}

export async function deleteTrackFromLibrary(int_id: number) {
  const trackRecord = await getTrackByIntId(int_id);
  if (!trackRecord) return;
  await removeDownload(trackRecord.id);
  return deleteTrack(int_id);
}

// playlists

export async function addPlaylistToLibrary(
  playlistData: YtApiPlaylist,
): Promise<LibraryOperationResult> {
  const playlistExists = await doesPlaylistExist(playlistData.id);
  if (playlistExists) {
    await updateSavedPlaylist(playlistData);
  } else {
    await savePlaylist(playlistData);
  }
  await downloadPlaylist(playlistData.tracks, playlistData.id);
  return {
    added: !playlistExists,
    updated: playlistExists,
  };
}

export async function updatePlaylistInLibrary(
  playlistIntId: number,
  interaction: ChatInputCommandInteraction,
) {
  const existingPlaylistData = await getPlaylist(playlistIntId);
  if (!existingPlaylistData) {
    return;
  }
  const queryResult = await getMetadataFromQuery(existingPlaylistData.url, {
    useLibrary: false, // fetch fresh playlist data for update
  });
  const freshPlaylist = queryResult?.playlist;
  if (!freshPlaylist) {
    return;
  }
  interaction.editReply(
    `Found ${freshPlaylist.tracks.length} tracks in playlist, updating and downloading any new tracks...`,
  );
  return {
    operation: await addPlaylistToLibrary(freshPlaylist),
    playlistData: existingPlaylistData,
  };
}

export async function deletePlaylistFromLibrary(int_id: number) {
  const trackRecords = await getTracksByPlaylist(int_id);
  const rmPromises = trackRecords.map((t) => removeDownload(t.id));
  await Promise.all(rmPromises);

  return deleteSavedPlaylist(int_id);
}
