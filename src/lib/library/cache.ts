import path from "node:path";
import { YtApiTrack } from "../youtube/metadata.js";
import { getLibraryDir } from "../environment.js";
import ytdl from "@distube/ytdl-core";
import { createReadStream, createWriteStream, existsSync } from "node:fs";
import { finished } from "node:stream/promises";
import { agent } from "../youtube/agent.js";
import { rm } from "node:fs/promises";
import { log } from "../logger.js";

function getItemPath(id: string) {
  const libDir = getLibraryDir();
  const itemPath = path.join(libDir, id + ".opus");
  const exists = existsSync(itemPath);
  return { path: itemPath, exists };
}

export async function downloadId(id: string) {
  // download single video ID to cache dir
  try {
    const targetPath = getItemPath(id);
    if (targetPath.exists) {
      return false;
    }
    log({ type: "CACHE", user: "BOT", message: `Downloading ${id}...` });

    const ytStream = ytdl(id, {
      filter: "audioonly",
      quality: "highestaudio",
      agent,
    });

    await finished(ytStream.pipe(createWriteStream(targetPath.path)));
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

export async function downloadPlaylist(
  tracks: YtApiTrack[],
  playlistId: string,
) {
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
