import { createAudioResource, demuxProbe } from "@discordjs/voice";
import { ReadStream } from "fs";
import { Readable } from "node:stream";

import { getDownloadedIdStream } from "../library/cache";
import { QueuedTrack } from "../queue";
import { getStreamUrl } from "./client";
import { fetchStream } from "./fetch";

export const getYtStream = async (id: string) => {
  try {
    const url = await getStreamUrl(id);
    const stream = await fetchStream(url);
    return stream;
  } catch (err) {
    throw new Error(`No compatible streams found for ${id}. ${err}`);
  }
};

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
    throw new Error(`Unable to play ${track.id}.`);
  }
}
