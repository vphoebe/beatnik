import type { Provider, ProviderPlaylist, ProviderTrack } from "@beatnik/providers";
import { log } from "@beatnik/shared";
import { createReadStream, createWriteStream, existsSync } from "node:fs";
import { readdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import type { Readable } from "node:stream";
import { finished } from "node:stream/promises";

import { getLibraryDir } from "../environment";

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

export async function downloadToCache(id: string, stream: Readable) {
  // download stream to cache dir
  try {
    const targetPath = getItemPath(id);
    if (targetPath.exists) {
      return false;
    }
    log({ component: "CORE", name: "CACHE", message: `Downloading ${id}...` });

    const diskStream = createWriteStream(targetPath.path);
    await finished(stream.pipe(diskStream));

    log({ component: "CORE", name: "CACHE", message: `Finished downloading ${id}` });
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
  log({ component: "CORE", name: "CACHE", message: `Deleting ${id} from disk.` });

  return rm(targetPath.path);
}

export async function downloadPlaylist(
  playlist: ProviderPlaylist,
  provider: Provider,
  onProgress?: (track: ProviderTrack, index: number, total: number) => void,
) {
  const tracksToDownload = playlist.tracks.filter((t) => !getItemPath(t.id).exists);
  for (const [index, track] of tracksToDownload.entries()) {
    try {
      const stream = await provider.getStream(track.id);
      await downloadToCache(track.id, stream);
      onProgress?.(track, index, tracksToDownload.length);
    } catch (err) {
      console.error(`Failed to download ${track.id}`, err);
    }
  }
}

export function getDownloadedIdStream(id: string) {
  const targetPath = getItemPath(id);
  if (!targetPath.exists) return undefined;
  return createReadStream(targetPath.path);
}
