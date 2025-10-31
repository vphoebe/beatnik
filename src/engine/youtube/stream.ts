import { createAudioResource, demuxProbe } from "@discordjs/voice";
import type { ReadStream } from "fs";
import type { Readable } from "node:stream";

import { createSabrStream } from "./sabr";

import { getDownloadedIdStream } from "@engine/library/cache";

import type { QueuedTrack } from "@helpers/queue";

export async function getYtStream(id: string) {
  try {
    const stream = await createSabrStream(id);
    return stream;
  } catch (err) {
    throw new Error(`No compatible streams found for ${id}. ${err}`);
  }
}

export async function createResource(track: QueuedTrack) {
  // return resource either from stream or cache
  try {
    let inputStream: Readable | ReadStream | undefined = getDownloadedIdStream(track.id);
    let fromCache = true;
    if (!inputStream) {
      // grab api stream from youtube
      inputStream = await getYtStream(track.id);
      fromCache = false;
    }
    const { stream, type } = await demuxProbe(inputStream);

    stream.on("error", (err) => console.error("Stream error", err));

    const resource = createAudioResource(stream, {
      inputType: type,
      metadata: {
        title: track.title,
      },
      inlineVolume: true,
    });

    resource.volume?.setVolumeDecibels(-track.loudness);

    return { resource, fromCache };
  } catch (err) {
    console.error(err);
    throw new Error(`Unable to play ${track.id}.`);
  }
}
