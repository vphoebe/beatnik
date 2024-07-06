import path from "node:path";
import { getTrack, saveTrack } from "./db.js";
import { Track } from "./youtube/metadata.js";
import { getCookieHeaders, getLibraryDir } from "./environment.js";
import ytdl from "@distube/ytdl-core";
import { createReadStream, createWriteStream, existsSync } from "node:fs";
import { finished } from "node:stream/promises";

export function testLibrary() {
  getLibraryDir();
}

function getItemPath(id: string) {
  const libDir = getLibraryDir();
  const itemPath = path.join(libDir, id + ".opus");
  const exists = existsSync(itemPath);
  return { path: itemPath, exists };
}

export async function addTrack(track: Track) {
  // add track to db and save file
  console.log(`Saving track: ${track.id}`);
  const existingTrack = await getTrack(track.id);
  if (existingTrack) {
    return {
      added: false,
      error: "EXISTS",
    };
  }
  const dbOp = await saveTrack(track);
  console.log(dbOp);
  await downloadId(track.id);
  return {
    added: true,
  };
}

async function downloadId(id: string) {
  // download single video ID to cache dir
  const targetPath = getItemPath(id);
  const stream = ytdl(id, {
    filter: "audioonly",
    quality: "highestaudio",
    ...getCookieHeaders,
  });

  const diskStream = createWriteStream(targetPath.path);
  await finished(stream.pipe(diskStream));
}

export function getDownloadedIdStream(id: string) {
  const targetPath = getItemPath(id);
  if (!targetPath.exists) return undefined;
  return createReadStream(targetPath.path);
}
