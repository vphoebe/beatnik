// tracks
import { getLibraryDir } from "../environment.js";
import { log } from "../logger.js";
import { getMetadataFromQuery, YtApiPlaylist, YtApiTrack } from "../youtube/metadata.js";
import { downloadId, downloadPlaylist, removeDownload } from "./cache.js";
import { prisma } from "./db/client.js";
import {
  doesPlaylistExist,
  updateSavedPlaylist,
  savePlaylist,
  getPlaylist,
} from "./db/playlist.js";
import { getTrackByYtId, createTrack, getTrackByIntId, deleteTrack } from "./db/track.js";

export interface LibraryOperationResult {
  added: boolean;
  updated?: boolean;
  error?: "EXISTS";
}

export async function testLibraryConnection() {
  try {
    getLibraryDir();
    log({
      type: "CACHE",
      user: "BOT",
      message: "Connected to library cache directory!",
    });
    await prisma.$connect();
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

export async function updatePlaylistInLibrary(playlistIntId: number) {
  const playlistData = await getPlaylist(playlistIntId);
  if (!playlistData) {
    return;
  }
  const queryResult = await getMetadataFromQuery(playlistData.url, {
    useLibrary: false, // fetch fresh playlist data for update
  });
  const freshPlaylist = queryResult?.playlist;
  if (!freshPlaylist) {
    return;
  }
  return {
    operation: await addPlaylistToLibrary(freshPlaylist),
    playlistData,
  };
}

export async function deletePlaylistFromLibrary(playlistId?: string, int_id?: number) {
  if (!int_id) {
    const existingPlaylist = await prisma.playlist.findFirst({
      where: { id: playlistId },
    });
    if (!existingPlaylist) {
      return null;
    }
    int_id = existingPlaylist.int_id;
  }

  const trackRecords = await prisma.track.findMany({
    where: { playlistId: int_id },
  });
  const rmPromises = trackRecords.map((t) => removeDownload(t.id));
  await Promise.all(rmPromises);

  return prisma.playlist.delete({
    where: { int_id },
  });
}
