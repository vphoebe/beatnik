import "dotenv/config";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

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

export function getCookiesArray() {
  const filepath = process.env.YT_COOKIE_JSON;
  if (!filepath) return {};
  return JSON.parse(readFileSync(path.resolve(filepath), "utf-8"));
}
