import fs from "node:fs";
import path from "node:path";
import internal from "node:stream";

const CACHE_PATH = "./cache-test";

function getPath(id: string) {
  const filename = `${id}.opus`;
  return path.join(__dirname, CACHE_PATH, filename);
}

export function writeToCache(id: string, stream: internal.Readable): void {
  const fileStream = fs.createWriteStream(getPath(id));
  stream.pipe(fileStream);
}

export function readFromCache(id: string): internal.Readable {
  const fileStream = fs.createReadStream(getPath(id));
  return fileStream;
}

export function checkCacheExists(id: string): boolean {
  return fs.existsSync(getPath(id));
}
