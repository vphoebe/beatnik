import ytdl from "@distube/ytdl-core";
import { getDownloadedIdStream } from "../library.js";
import { QueuedTrack } from "../queue.js";
import { getCookieHeaders } from "../environment.js";
import { ReadStream } from "fs";
import { Readable } from "node:stream";
import { createAudioResource, demuxProbe } from "@discordjs/voice";

export async function createResource(track: QueuedTrack) {
  // return resource either from stream or cache
  let stream: Readable | ReadStream | undefined = getDownloadedIdStream(
    track.id,
  );
  let fromCache = true;
  if (!stream) {
    // grab api stream from youtube
    stream = ytdl(track.id, {
      filter: "audioonly",
      quality: "lowestaudio",
      ...getCookieHeaders,
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

  resource.volume?.setVolumeDecibels(-track.loudness);

  return { resource, fromCache };
}
