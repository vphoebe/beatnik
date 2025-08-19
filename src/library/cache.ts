import { createReadStream, createWriteStream, existsSync } from "node:fs";
import { readdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import { finished } from "node:stream/promises";

import type { YtApiTrack } from "youtube/metadata";
import { getYtStream } from "youtube/stream";

import { getLibraryDir } from "helpers/environment";
import { log } from "helpers/logger";

function getItemPath(id: string) {
  const libDir = getLibraryDir();
  const itemPath = path.join(libDir, id + ".cache");
  const exists = existsSync(itemPath);
  return { path: itemPath, exists };
}

export async function migrateCacheNames() {
  const libDir = getLibraryDir();
  const files = await readdir(libDir);
  const opusFiles = files.filter((f) => f.endsWith(".opus"));
  const renamePromises = opusFiles.map((f) => {
    const oldPath = path.join(libDir, f);
    const newPath = path.join(libDir, f.replace(".opus", ".cache"));
    return rename(oldPath, newPath);
  });
  await Promise.all(renamePromises);
  return renamePromises.length;
}

export async function countCacheFiles() {
  const libDir = getLibraryDir();
  const files = await readdir(libDir);
  const cacheFiles = files.filter((f) => f.endsWith(".cache"));
  return cacheFiles.length;
}

export async function downloadId(id: string) {
  // download single video ID to cache dir
  try {
    const targetPath = getItemPath(id);
    if (targetPath.exists) {
      return false;
    }
    log({ type: "CACHE", user: "BOT", message: `Downloading ${id}...` });

    const ytStream = await getYtStream(id);
    const diskStream = createWriteStream(targetPath.path);

    // TODO: this works and I'm leaving the ts error to resolve
    await finished(ytStream.pipe(diskStream));

    log({ type: "CACHE", user: "BOT", message: `Finished downloading ${id}` });
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

export async function removeDownload(id: string) {
  const targetPath = getItemPath(id);
  if (!targetPath.exists) {
    return;
  }
  log({ type: "CACHE", user: "BOT", message: `Deleting ${id} from disk.` });

  return rm(targetPath.path);
}

export async function downloadPlaylist(tracks: YtApiTrack[], playlistId: string) {
  log({
    type: "CACHE",
    user: "BOT",
    message: `Downloading playlist ${playlistId} with ${tracks.length} tracks.`,
  });
  const results = await Promise.all(tracks.map((t) => downloadId(t.id)));
  const downloadedFileCount = results.filter((r) => r === true).length;
  log({
    type: "CACHE",
    user: "BOT",
    message: `Downloaded ${downloadedFileCount} new tracks for playlist ${playlistId}.`,
  });
}

export function getDownloadedIdStream(id: string) {
  const targetPath = getItemPath(id);
  if (!targetPath.exists) return undefined;
  return createReadStream(targetPath.path);
}
