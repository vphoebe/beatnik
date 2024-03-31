import { QueuedTrack } from "../classes/Queue.js";
import { checkIdIsCached, readFromCache, writeToCache } from "./cache.js";
import { ParsedQuery } from "./parsePlayQuery.js";
import { StreamType, createAudioResource, demuxProbe } from "@discordjs/voice";
import { Readable } from "stream";
import ytdl from "@distube/ytdl-core";
import ytpl from "@distube/ytpl";
import { stream as playDlStream } from "play-dl";
import cloneable from "cloneable-readable";
import { WriteStream } from "fs";
import { durationStringToSeconds } from "./util.js";

type SimpleMetadata = {
  type: "video" | "playlist" | "unknown";
  title: string;
  author: string;
  numberOfTracks: number;
};

export async function getYtStream(
  id: string,
  url: string
): Promise<{
  stream: Readable;
  cacheStream?: WriteStream;
  fromCache: boolean;
  type: StreamType;
}> {
  const cacheHit = checkIdIsCached(id);
  if (!cacheHit) {
    // play live url, and update cache
    const ytStream = await playDlStream(url, {
      quality: 2,
      discordPlayerCompatibility: true,
    });
    const source = cloneable(ytStream.stream);
    const cacheSource = source.clone();
    const cacheStream = writeToCache(id, cacheSource);
    return {
      stream: source,
      type: ytStream.type,
      cacheStream,
      fromCache: false,
    };
  } else {
    // we know this cache stream exists because we checked the cache hit
    const cacheStream = readFromCache(id) as Readable;
    const { type } = await demuxProbe(cacheStream);
    return { stream: cacheStream, fromCache: true, type };
  }
}

export async function parsedQueryToMetadata(
  query: ParsedQuery
): Promise<SimpleMetadata> {
  const { url, type } = query;
  if (type === "video") {
    const info = await ytdl.getInfo(url);
    const { videoDetails } = info;
    const { title, author } = videoDetails;
    return { type, title, author: author.name, numberOfTracks: 1 };
  } else if (type === "playlist") {
    const playlist = await ytpl(url, { limit: Infinity });
    const { title, author, total_items } = playlist;
    return {
      type,
      title,
      author: author?.name ?? "",
      numberOfTracks: total_items,
    };
  } else {
    return {
      type: "unknown",
      title: "Unknown",
      author: "Unknown",
      numberOfTracks: 0,
    };
  }
}

export async function parsedQueryToYoutubeQueuedTracks(
  query: ParsedQuery,
  addedBy: string
): Promise<QueuedTrack[]> {
  const { url, service, type } = query;
  if (type === "video") {
    const info = await ytdl.getInfo(url);
    const { videoDetails } = info;
    const { title, lengthSeconds, thumbnails, author, videoId } = videoDetails;
    const track = {
      title,
      length: parseInt(lengthSeconds),
      url,
      id: videoId,
      service,
      channel: author.name,
      thumbnailImageUrl: thumbnails[0].url,
      addedBy,
    };
    return [track];
  } else if (type === "playlist") {
    const playlist = await ytpl(url, { limit: Infinity });
    return playlist.items.map((item) => ({
      title: item.title,
      length: durationStringToSeconds(item.duration ?? "0:00"),
      url: item.url,
      id: item.id,
      service,
      channel: item.author?.name,
      thumbnailImageUrl: item.thumbnail ?? undefined,
      addedBy,
    }));
  } else {
    throw new Error("Unknown error with query");
  }
}

export async function createYoutubeTrackResource(track: QueuedTrack) {
  const {
    stream: contentStream,
    cacheStream,
    fromCache,
    type,
  } = await getYtStream(track.id, track.url);

  const resource = createAudioResource(contentStream, {
    inputType: type,
    metadata: {
      title: track.title,
    },
  });

  const breakCurrentStreams = cacheStream
    ? () => {
        if (!cacheStream.writableFinished) {
          cacheStream?.emit("break");
          contentStream.destroy();
        }
      }
    : () => {
        return;
      };

  return { resource, fromCache, breakCurrentStreams };
}
