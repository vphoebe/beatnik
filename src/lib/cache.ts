import { getCacheDir, getMaxCacheSize } from "./environment.js";
import { log } from "./logger.js";
import fs from "node:fs";
import { readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

function getCacheItemPath(id: string) {
  const cacheDir = getCacheDir();
  if (!cacheDir) return undefined;
  return path.join(cacheDir, id + ".opus");
}

async function getAllCacheFiles() {
  const cacheDir = getCacheDir();
  if (!cacheDir) return [];
  const files = await readdir(cacheDir);
  return files.filter((filename) => filename.includes(".opus"));
}

async function getAllCacheParts() {
  const cacheDir = getCacheDir();
  if (!cacheDir) return [];
  const files = await readdir(cacheDir);
  return files.filter((filename) => filename.includes(".opus.part"));
}

async function getAllLegacyCacheFiles() {
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
    0,
  );
  return { table, totalSize };
}

export function writeToCache(
  id: string,
  cacheSource: Readable,
): fs.WriteStream | undefined {
  const cachePath = getCacheItemPath(id);
  if (!cachePath) return undefined;

  const partPath = cachePath + ".part";
  if (fs.existsSync(partPath)) {
    // remove in case the part never got renamed
    fs.unlinkSync(partPath);
  }
  const cacheStream = fs.createWriteStream(partPath);
  cacheSource.pipe(cacheStream);

  cacheStream.on("break", () => {
    log({
      type: "CACHE",
      user: "BOT",
      message: "Breaking cache stream and deleting in-progress file...",
    });
    fs.unlinkSync(partPath);
    cacheStream.destroy();
  });

  cacheStream.on("error", (err) => {
    log({
      type: "ERROR",
      user: "BOT",
      message: err.message,
    });
    fs.unlinkSync(partPath);
  });

  cacheStream.on("finish", () => {
    // remove .part to make valid cache object
    fs.renameSync(partPath, cachePath);

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

  return cacheStream;
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

export async function cleanUpParts() {
  const cacheDir = getCacheDir();
  if (!cacheDir) return;
  const partFiles = await getAllCacheParts();
  if (!partFiles.length) return;
  const rmPromises = partFiles.map((file) => rm(path.join(cacheDir, file)));
  await Promise.all(rmPromises);
  log({
    type: "CACHE",
    message: `Removed ${partFiles.length} broken cache files.`,
    user: "BOT",
  });
}

export async function evictCache(evictAll?: boolean) {
  const cacheDir = getCacheDir();
  if (!cacheDir) return;
  if (evictAll) {
    const cacheFiles = await getAllCacheFiles();
    const legacyCacheFiles = await getAllLegacyCacheFiles();
    const partFiles = await getAllCacheParts();
    const rmPromises = [...cacheFiles, ...legacyCacheFiles, ...partFiles].map(
      (file) => rm(path.join(cacheDir, file)),
    );
    await Promise.all(rmPromises);
    log({
      type: "CACHE",
      message: `Removed all files from ${getMaxCacheSize()} MB cache.`,
      user: "BOT",
    });
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

export async function checkCacheValidity(version: string) {
  const cacheDir = getCacheDir();
  if (!cacheDir) return;

  const versionFilepath = path.join(cacheDir, "version.txt");
  const versionFileExists = fs.existsSync(versionFilepath);
  if (!versionFileExists) {
    console.log("No version file found in cache! Evicting...");
    await evictCache(true);
    fs.writeFileSync(versionFilepath, version, "utf-8");
    return;
  } else {
    const versionData = fs.readFileSync(versionFilepath, "utf-8");
    if (versionData !== version) {
      console.log("Beatnik has updated, evicting cache...");
      await evictCache(true);
      fs.writeFileSync(versionFilepath, version, "utf-8");
      return;
    }
  }
}
