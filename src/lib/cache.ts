import { getCachePath } from "./environment";
import { log } from "./logger";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

function getPath(id: string) {
  const cachePath = getCachePath();
  if (cachePath) {
    return path.join(cachePath, id);
  }
  return undefined;
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
    });
  }
}

export function readFromCache(id: string): Readable | undefined {
  const cachePath = getPath(id);
  if (cachePath) {
    const fileStream = fs.createReadStream(cachePath);
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
