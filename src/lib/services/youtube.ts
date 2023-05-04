import { QueuedTrack } from '../../classes/Queue.js';
import { checkIdIsCached, readFromCache, writeToCache } from '../cache.js';
import { ParsedQuery } from '../parsePlayQuery.js';
import { createAudioResource, demuxProbe } from "@discordjs/voice";
import { Readable } from "stream";
import ytdl, { videoFormat } from "ytdl-core";
import ytpl from "ytpl";

type SimpleMetadata = {
  type: "video" | "playlist" | "unknown";
  title: string;
  author: string;
  numberOfTracks: number;
};

// implemented from https://github.com/amishshah/ytdl-core-discord/commit/cb3dc69692f9231c63f6858e150df3dcb893c2b0
function findWebmOpusFormat(format: videoFormat) {
  return (
    format.codecs === "opus" &&
    format.container === "webm" &&
    format.audioSampleRate === "48000"
  );
}

// implemented from https://github.com/amishshah/ytdl-core-discord/commit/cb3dc69692f9231c63f6858e150df3dcb893c2b0
export async function getYtStream(
  id: string,
  url: string,
  options: ytdl.downloadOptions = {}
): Promise<{ stream: Readable; fromCache: boolean }> {
  const cacheHit = checkIdIsCached(id);
  if (!cacheHit) {
    // play live url, and update cache
    const info = await ytdl.getInfo(url);
    const format = info.formats.find(findWebmOpusFormat);
    const canDemux = format && info.videoDetails.lengthSeconds !== "0";
    if (canDemux) {
      options = { ...options, filter: findWebmOpusFormat };
    } else if (info.videoDetails.lengthSeconds !== "0") {
      options = { ...options, filter: "audioonly" };
    }
    const stream = ytdl.downloadFromInfo(info, options);
    const cacheStream = ytdl.downloadFromInfo(info, options);
    writeToCache(id, cacheStream);
    return { stream, fromCache: false };
  } else {
    // we know this cache stream exists because we checked the cache hit
    const cacheStream = readFromCache(id) as Readable;
    return { stream: cacheStream, fromCache: true };
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
  const options = {
    highWaterMark: 1 << 62,
    liveBuffer: 1 << 62,
    dlChunkSize: 0, // disabling chunking is recommended in discord bot
    quality: "lowestaudio",
  };

  const { stream: ytStream, fromCache } = await getYtStream(
    track.id,
    track.url,
    options
  );
  const { stream, type } = await demuxProbe(ytStream);

  const resource = createAudioResource(stream, {
    inputType: type,
    metadata: {
      title: track.title,
    },
  });

  return { resource, fromCache };
}
