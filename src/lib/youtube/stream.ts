import { createAudioResource, demuxProbe } from "@discordjs/voice";
import ytdl from "@distube/ytdl-core";
import { ReadStream } from "fs";
import { Readable } from "node:stream";

import { getDownloadedIdStream } from "../library/cache.js";
import { QueuedTrack } from "../queue.js";
import { agent } from "./agent.js";

export async function createResource(track: QueuedTrack) {
  // return resource either from stream or cache
  let stream: Readable | ReadStream | undefined = getDownloadedIdStream(track.id);
  let fromCache = true;
  if (!stream) {
    // grab api stream from youtube
    stream = ytdl(track.id, {
      filter: "audioonly",
      quality: "lowestaudio",
      agent,
    });
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
}
