import { createAudioResource, demuxProbe } from "@discordjs/voice";
import { ReadStream } from "fs";
import { Readable } from "node:stream";

import { getDownloadedIdStream } from "../library/cache.js";
import { QueuedTrack } from "../queue.js";
import { getYtStream } from "./innertube.js";

export async function createResource(track: QueuedTrack, retries = 0) {
  // return resource either from stream or cache
  try {
    let stream: Readable | ReadStream | undefined = getDownloadedIdStream(track.id);
    let fromCache = true;
    if (!stream) {
      // grab api stream from youtube
      stream = await getYtStream(track.id);
      fromCache = false;
    }
    const { type } = await demuxProbe(stream);

    const resource = createAudioResource(stream, {
      inputType: type,
      metadata: {
        title: track.title,
      },
      inlineVolume: !!track.loudness,
    });
    if (track.loudness) {
      resource.volume?.setVolumeDecibels(-track.loudness);
    }

    return { resource, fromCache };
  } catch (err) {
    console.error(err);

    if (retries < 1) {
      retries++;
      return createResource(track, retries);
    } else {
      throw new Error(`Unable to play ${track.id} after ${retries + 1} attempts.`);
    }
  }
}
