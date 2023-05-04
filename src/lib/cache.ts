import { getCacheDir, getMaxCacheSize } from './environment.js';
import { log } from './logger.js';
import fs from "node:fs";
import { readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

function getCacheItemPath(id: string) {
  const cacheDir = getCacheDir();
  if (!cacheDir) return undefined;
  return path.join(cacheDir, id + ".cache");
}

async function getAllCacheFiles() {
  const cacheDir = getCacheDir();
  if (!cacheDir) return [];
  const files = await readdir(cacheDir);
  return files.filter((filename) => filename.includes(".cache"));
}

async function getCacheTable() {
  const cacheDir = getCacheDir();
  if (!cacheDir) return { table: [], totalSize: 0 };
  const cacheFiles = await getAllCacheFiles();
  const table = [];
  for (const file of cacheFiles) {
    const { size, atime, mtime } = await stat(path.join(cacheDir, file));
    table.push({
      file,
      size,
      atime: atime ?? mtime,
    });
  }
  const totalSize = table.reduce(
    (accumulator, { size }) => accumulator + size,
    0
  );
  return { table, totalSize };
}

export function writeToCache(id: string, stream: Readable): void {
  const cachePath = getCacheItemPath(id);
  if (!cachePath) return;
  const fileStream = fs.createWriteStream(cachePath);
  stream.pipe(fileStream);
  fileStream.on("close", () => {
    log({
      type: "CACHE",
      user: "BOT",
      message: `${id} successfully written to cache.`,
    });
    getCacheTable().then(({ totalSize }) => {
      if (totalSize >= getMaxCacheSize() * 1024 ** 2) {
        evictCache();
      }
    });
  });
}

export function readFromCache(id: string): Readable | undefined {
  const cachePath = getCacheItemPath(id);
  if (!cachePath) return undefined;
  const time = new Date();
  const fileStream = fs.createReadStream(cachePath);
  fs.utimesSync(cachePath, time, time);
  return fileStream;
}

export function checkIdIsCached(id: string): boolean {
  const cachePath = getCacheItemPath(id);
  if (!cachePath) return false;
  return fs.existsSync(cachePath);
}

export async function evictCache(evictAll?: boolean) {
  const cacheDir = getCacheDir();
  if (!cacheDir) return;
  if (evictAll) {
    const cacheFiles = await getAllCacheFiles();
    for (const file of cacheFiles) {
      await rm(path.join(cacheDir, file));
      log({
        type: "CACHE",
        message: `Removed all files from ${getMaxCacheSize()} MB cache.`,
        user: "BOT",
      });
    }
  } else {
    // remove oldest lastModified file
    const { table } = await getCacheTable();
    table.sort((a, b) => {
      return a.atime.getTime() - b.atime.getTime();
    });
    const file = table[0].file;
    const cachePath = path.join(cacheDir, file);
    await rm(cachePath);
    log({
      type: "CACHE",
      message: `Removed ${file} from ${getMaxCacheSize()} MB cache as it hasn't been accessed since ${table[0].atime.toLocaleDateString()}`,
      user: "BOT",
    });
  }
}
