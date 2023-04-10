import { getCachePath, getMaxCacheSize } from "./environment";
import { log } from "./logger";
import fs from "node:fs";
import { readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

let totalCacheSize = 0;

function getPath(id: string) {
  const cacheDir = getCachePath();
  if (cacheDir) {
    return path.join(cacheDir, id + ".cache");
  }
  return undefined;
}

async function getCacheTable() {
  const cacheDir = getCachePath();
  if (!cacheDir) return { table: [], totalSize: 0 };
  const files = await readdir(cacheDir);
  const cacheFiles = files.filter((filename) => filename.includes(".cache"));
  const table = [];
  for (const file of cacheFiles) {
    const { size, atime, mtime } = await stat(path.join(cacheDir, file));
    table.push({
      file,
      size,
      atime,
      mtime,
    });
  }
  const totalSize = table.reduce(
    (accumulator, { size }) => accumulator + size,
    0
  );
  return { table, totalSize };
}

export function writeToCache(id: string, stream: Readable): void {
  const cachePath = getPath(id);
  if (cachePath) {
    const fileStream = fs.createWriteStream(cachePath);
    stream.pipe(fileStream);
    fileStream.on("close", () => {
      log({
        type: "CACHE",
        user: "BOT",
        message: `${id} successfully written to cache.`,
      });
      getCacheTable().then(({ totalSize }) => {
        totalCacheSize = totalSize;
        if (totalCacheSize >= getMaxCacheSize() * 1024 ** 2) {
          evictCache();
        }
      });
    });
  }
}

export function readFromCache(id: string): Readable | undefined {
  const cachePath = getPath(id);
  if (cachePath) {
    const time = new Date();
    const fileStream = fs.createReadStream(cachePath);
    fs.utimesSync(cachePath, time, time);
    return fileStream;
  }
}

export function checkIdIsCached(id: string): boolean {
  const cachePath = getPath(id);
  if (cachePath) {
    return fs.existsSync(cachePath);
  }
  return false;
}

export async function evictCache(all?: boolean) {
  const cacheDir = getCachePath();
  if (cacheDir) {
    if (all) {
      const files = await readdir(cacheDir);
      const cacheFiles = files.filter((filename) =>
        filename.includes(".cache")
      );
      for (const file of cacheFiles) {
        await rm(path.join(cacheDir, file));
      }
    } else {
      // remove oldest lastModified file
      const { table } = await getCacheTable();
      table.sort((a, b) => {
        const aTime = a.atime ?? a.mtime;
        const bTime = b.atime ?? b.mtime;
        return aTime.getTime() - bTime.getTime();
      });
      const file = table[0].file;
      const cachePath = path.join(cacheDir, file);
      if (cachePath) {
        await rm(cachePath);
        log({
          type: "CACHE",
          message: `Removed ${file} from ${getMaxCacheSize()} MB cache as it hasn't been accessed since ${table[0].atime.toLocaleDateString()}`,
          user: "BOT",
        });
        getCacheTable().then(({ totalSize }) => {
          totalCacheSize = totalSize;
        });
      }
    }
  }
}
