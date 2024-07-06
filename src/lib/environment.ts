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
  const maxCacheSize = getMaxCacheSize();
  if (maxCacheSize === 0) return undefined;
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

export function getLibraryDir() {
  const libraryPath = process.env.LIBRARY_PATH;
  if (!libraryPath) {
    console.error("No LIBRARY_PATH found in .env!");
    process.exit();
  } else {
    if (!existsSync(libraryPath)) {
      console.error(`LIBRARY_PATH ${libraryPath} does not exist!`);
      process.exit();
    }
  }
  return libraryPath;
}

export function getMaxCacheSize() {
  const maxSize = process.env.MAX_CACHE_SIZE_IN_MB;
  return maxSize ? parseInt(maxSize) : 128;
}

export function getCookieHeaders() {
  const envCookie = process.env.YT_COOKIE;
  if (!envCookie) {
    return {};
  } else {
    return {
      requestOptions: {
        headers: {
          cookie: envCookie,
        },
      },
    };
  }
}
