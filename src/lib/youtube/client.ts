import { Stream } from "node:stream";
import { Innertube, UniversalCache } from "youtubei.js";

import { log } from "../logger";

const clientPromise = Innertube.create({
  cache: new UniversalCache(true),
});

const streamClientPromise = Innertube.create({
  cache: new UniversalCache(false),
});

export const getClient = async (streamClient = false) => {
  if (streamClient) return await streamClientPromise;
  return await clientPromise;
};

export const getYtStream = async (id: string) => {
  try {
    const yt = await getClient(true);
    const stream = await yt.download(id, {
      type: "audio",
      codec: "opus",
      quality: "best",
      client: "WEB",
    });
    return Stream.Readable.fromWeb(stream);
  } catch (_) {
    // if no preferred stream found, just get whatever
    log({
      type: "INFO",
      user: "BOT",
      message: `Unable to find optimal stream for ${id}, falling back to first available.`,
    });
    const yt = await getClient();
    const url = (await yt.getStreamingData(id, { format: "any" })).decipher();
    const stream = (await fetch(url)).body;
    if (!stream) {
      throw new Error(`No compatible streams found for ${id}.`);
    }
    return Stream.Readable.fromWeb(stream);
  }
};
