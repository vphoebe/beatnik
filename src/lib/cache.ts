import { log } from "./logger";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

const CACHE_PATH = process.env.CACHE_PATH;
export const DISABLE_CACHE = process.env.DISABLE_CACHE === "true";

function getPath(id: string) {
  if (CACHE_PATH && !DISABLE_CACHE) {
    const pathExists = fs.existsSync(CACHE_PATH);
    if (!pathExists) {
      console.error(`CACHE_PATH ${CACHE_PATH} does not exist!`);
      return undefined;
    }
    const filename = `${id}.cache`;
    return path.join(CACHE_PATH, filename);
  } else if (!CACHE_PATH) {
    console.error("CACHE_PATH not specified in environment!");
  } else if (DISABLE_CACHE) {
    return undefined;
  }
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
