import "dotenv/config";
import { existsSync } from "node:fs";

export function getToken() {
  const token = process.env.TOKEN;
  if (!token) {
    console.error("No TOKEN found in .env, exiting!");
    process.exit();
  }
  return token;
}

export function getClientId() {
  const clientId = process.env.CLIENT_ID;
  if (!clientId) {
    console.error("No CLIENT_ID found in .env, exiting!");
    process.exit();
  }
  return clientId;
}

export function getDatabasePath() {
  const databasePath = process.env.DATABASE_PATH;
  if (!databasePath) {
    console.error("No DATABASE_PATH found in .env, exiting!");
    process.exit();
  }
  return databasePath;
}

export function getCacheDir() {
  const cachePath = process.env.CACHE_PATH;
  const DISABLE_CACHE = process.env.DISABLE_CACHE === "true";
  if (DISABLE_CACHE) return undefined;
  if (!cachePath) {
    console.error("No CACHE_PATH found in .env!");
  } else {
    if (!existsSync(cachePath)) {
      console.error(`CACHE_PATH ${cachePath} does not exist!`);
      return undefined;
    }
  }
  return cachePath;
}

export function getMaxCacheSize() {
  const maxSize = process.env.MAX_CACHE_SIZE_IN_MB;
  return maxSize ? parseInt(maxSize) : 128;
}
