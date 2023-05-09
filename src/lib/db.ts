import { getDatabasePath } from "./environment.js";
import Keyv from "keyv";

export type SavedUrl = {
  name: string;
  url: string;
  guildId: string;
};

function getKeyv(guildId: string) {
  return new Keyv(`sqlite://${getDatabasePath()}`, { namespace: guildId }).on(
    "error",
    (err) => {
      console.error(err);
      throw new Error("Database connection error");
    }
  );
}

export async function getSavedUrl(
  guildId: string,
  name: string
): Promise<string | undefined> {
  const keyv = getKeyv(guildId);
  return await keyv.get(name);
}

export async function setSavedUrl(
  guildId: string,
  name: string,
  url: string
): Promise<string> {
  const keyv = getKeyv(guildId);
  const existing = await keyv.get(name);
  await keyv.set(name, url);
  return existing ? "Updated" : "Saved";
}

export async function removeSavedUrl(
  guildId: string,
  name: string
): Promise<boolean> {
  const keyv = getKeyv(guildId);
  const operation = await keyv.delete(name);
  return operation;
}

export async function getAllSavedUrls(guildId: string): Promise<SavedUrl[]> {
  const keyv = getKeyv(guildId);
  const saved = [];
  for await (const [key, value] of keyv.iterator(guildId)) {
    saved.push({ name: key, url: value, guildId });
  }
  return saved;
}
