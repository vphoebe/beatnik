import { createAudioResource, demuxProbe } from "@discordjs/voice";
import { ReadStream } from "fs";
import { Readable, Stream } from "node:stream";
import { Innertube, UniversalCache } from "youtubei.js";

import { getDownloadedIdStream } from "../library/cache.js";
import { QueuedTrack } from "../queue.js";

export async function createResource(track: QueuedTrack, retries = 0) {
  // return resource either from stream or cache
  try {
    const yt = await Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: true,
    });
    let stream: Readable | ReadStream | undefined = getDownloadedIdStream(track.id);
    let fromCache = true;
    if (!stream) {
      // grab api stream from youtube
      const innertubeStream = await yt.download(track.id as string, {
        type: "audio", // audio, video or video+audio
        client: "WEB",
      });

      stream = Stream.Readable.fromWeb(innertubeStream);
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

    if (retries < 0) {
      retries++;
      console.log("Retry");
      return createResource(track, retries);
    } else {
      throw new Error(`Unable to play ${track.id} after ${retries} attempts.`);
    }
  }
}
