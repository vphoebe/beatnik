// tracks
import type { ChatInputCommandInteraction } from "discord.js";

import {
  countCacheFiles,
  downloadId,
  downloadPlaylist,
  migrateCacheNames,
  removeDownload,
} from "./cache";

import {
  deleteSavedPlaylist,
  doesPlaylistExist,
  getPlaylist,
  getPlaylistCount,
  savePlaylist,
  updateSavedPlaylist,
} from "@db/playlist";
import {
  createTrack,
  deleteTrack,
  getTrackByIntId,
  getTrackByYtId,
  getTrackCount,
  getTracksByPlaylist,
} from "@db/track";

import type { YtApiPlaylist, YtApiTrack } from "@engine/youtube/metadata";
import { getMetadataFromQuery } from "@engine/youtube/metadata";

import { log } from "@helpers/logger";

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
        type: "CACHE",
        user: "BOT",
        message: `Migrated ${migratedCacheCount} files to new cache format`,
      });
    }
    const cacheCount = await countCacheFiles();
    log({
      type: "CACHE",
      user: "BOT",
      message: `Found ${cacheCount} cache files.`,
    });
    const playlists = getPlaylistCount();
    const tracks = getTrackCount();
    log({
      type: "DB",
      user: "BOT",
      message: `Connected to library database! (${playlists} playlists, ${tracks} tracks)`,
    });
  } catch (err) {
    console.error(err);
    process.exit();
  }
}

export async function addTrackToLibrary(track: YtApiTrack): Promise<LibraryOperationResult> {
  // add track to db and save file
  const existingTrack = getTrackByYtId(track.id);
  if (existingTrack) {
    return {
      added: false,
      updated: false,
      error: "EXISTS",
    };
  }
  createTrack({ ...track, playlistId: null, playlistIdx: null });
  await downloadId(track.id);
  return {
    added: true,
    updated: false,
  };
}

export async function deleteTrackFromLibrary(int_id: number) {
  const trackRecord = getTrackByIntId(int_id);
  if (!trackRecord) return;
  await removeDownload(trackRecord.id);
  deleteTrack(int_id);
  return { title: trackRecord?.title ?? "Unknown" };
}

// playlists

export async function addPlaylistToLibrary(
  playlistData: YtApiPlaylist,
): Promise<LibraryOperationResult> {
  const playlistExists = doesPlaylistExist(playlistData.id);
  if (playlistExists) {
    updateSavedPlaylist(playlistData);
  } else {
    savePlaylist(playlistData);
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
  const existingPlaylistData = getPlaylist(playlistIntId);
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
  const trackRecords = getTracksByPlaylist(int_id);
  const rmPromises = trackRecords.map((t) => removeDownload(t.id));
  await Promise.all(rmPromises);

  return deleteSavedPlaylist(int_id);
}
