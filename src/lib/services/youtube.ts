import { QueuedTrack } from "../../classes/Queue.js";
import { checkIdIsCached, readFromCache, writeToCache } from "../cache.js";
import { ParsedQuery } from "../parsePlayQuery.js";
import { StreamType, createAudioResource, demuxProbe } from "@discordjs/voice";
import { Readable } from "stream";
import ytdl from "@distube/ytdl-core";
import ytpl from "ytpl";
import { stream as playDlStream } from "play-dl";

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
  fromCache: boolean;
  type: StreamType;
}> {
  const cacheHit = checkIdIsCached(id);
  if (!cacheHit) {
    // play live url, and update cache
    const stream = await playDlStream(url, {
      quality: 2,
    });
    const cacheStream = await playDlStream(url, {
      quality: 2,
      discordPlayerCompatibility: true,
    });
    writeToCache(id, cacheStream.stream);
    return { stream: stream.stream, type: stream.type, fromCache: false };
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
    const playlist = await ytpl(url, { limit: 9999, pages: 9999 });
    const { title, author, estimatedItemCount } = playlist;
    return {
      type,
      title,
      author: author.name,
      numberOfTracks: estimatedItemCount,
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
    const playlist = await ytpl(url, { limit: 9999, pages: 9999 });
    return playlist.items.map((item) => ({
      title: item.title,
      length: item.durationSec ?? 0,
      url: item.shortUrl,
      id: item.id,
      service,
      channel: item.author.name,
      thumbnailImageUrl: item.bestThumbnail.url ?? undefined,
      addedBy,
    }));
  } else {
    throw new Error("Unknown error with query");
  }
}

export async function createYoutubeTrackResource(track: QueuedTrack) {
  const {
    stream: ytOrCacheStream,
    fromCache,
    type,
  } = await getYtStream(track.id, track.url);

  const resource = createAudioResource(ytOrCacheStream, {
    inputType: type,
    metadata: {
      title: track.title,
    },
  });

  return { resource, fromCache };
}
