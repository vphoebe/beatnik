// tracks
import type { ChatInputCommandInteraction } from "discord.js";

import { connectDb } from "../db/client";
import {
  deleteSavedPlaylist,
  doesPlaylistExist,
  getPlaylist,
  getPlaylistCount,
  savePlaylist,
  updateSavedPlaylist,
} from "../db/playlist";
import {
  createTrack,
  deleteTrack,
  getTrackByIntId,
  getTrackByYtId,
  getTrackCount,
  getTracksByPlaylist,
} from "../db/track";
import {
  countCacheFiles,
  downloadId,
  downloadPlaylist,
  migrateCacheNames,
  removeDownload,
} from "./cache";

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
    await connectDb();
    const playlists = await getPlaylistCount();
    const tracks = await getTrackCount();
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
