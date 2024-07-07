import path from "node:path";
import {
  getPlaylistWithTracks,
  getTrack,
  savePlaylist,
  saveTrack,
  updateSavedPlaylist,
} from "./db.js";
import { Playlist, Track } from "../youtube/metadata.js";
import { getLibraryDir } from "../environment.js";
import ytdl from "@distube/ytdl-core";
import { createReadStream, createWriteStream, existsSync } from "node:fs";
import { finished } from "node:stream/promises";
import { agent } from "../youtube/agent.js";
import { rm } from "node:fs/promises";

export interface AddOperation {
  added: boolean;
  updated: boolean;
  error?: "EXISTS";
}

export function testLibrary() {
  getLibraryDir();
}

function getItemPath(id: string) {
  const libDir = getLibraryDir();
  const itemPath = path.join(libDir, id + ".opus");
  const exists = existsSync(itemPath);
  return { path: itemPath, exists };
}

export async function addTrack(track: Track): Promise<AddOperation> {
  // add track to db and save file
  const existingTrack = await getTrack(track.id);
  if (existingTrack) {
    return {
      added: false,
      updated: false,
      error: "EXISTS",
    };
  }
  await saveTrack(track);
  await downloadId(track.id);
  return {
    added: true,
    updated: false,
  };
}

export async function addPlaylist(playlist: Playlist): Promise<AddOperation> {
  const existingPlaylist = await getPlaylistWithTracks(playlist.id);
  if (existingPlaylist) {
    await updateSavedPlaylist(playlist);
  } else {
    await savePlaylist(playlist);
  }
  await downloadPlaylist(playlist.tracks, playlist.id);
  return {
    added: !existingPlaylist,
    updated: !!existingPlaylist,
  };
}

async function downloadId(id: string) {
  // download single video ID to cache dir
  try {
    const targetPath = getItemPath(id);
    if (targetPath.exists) {
      return;
    }
    console.log(`Downloading ${id}...`);

    const stream = ytdl(id, {
      filter: "audioonly",
      quality: "highestaudio",
      agent,
    });

    const diskStream = createWriteStream(targetPath.path);
    await finished(stream.pipe(diskStream));
    console.log(`Finished downloading ${id}`);
  } catch (err) {
    console.error(err);
  }
}

export async function removeDownload(id: string) {
  const targetPath = getItemPath(id);
  if (!targetPath.exists) {
    return;
  }
  console.log(`Deleting ${id} from disk.`);

  return rm(targetPath.path);
}

async function downloadPlaylist(tracks: Track[], playlistId: string) {
  console.log(
    `Downloading playlist ${playlistId} with ${tracks.length} tracks.`,
  );
  await Promise.allSettled(tracks.map((t) => downloadId(t.id)));
  console.log(`Downloaded playlist ${playlistId}`);
}

export function getDownloadedIdStream(id: string) {
  const targetPath = getItemPath(id);
  if (!targetPath.exists) return undefined;
  return createReadStream(targetPath.path);
}
