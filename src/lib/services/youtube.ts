import { QueuedTrack } from "../../classes/Queue";
import { checkCacheExists, readFromCache, writeToCache } from "../cache";
import { ParsedQuery } from "../parsePlayQuery";
import { createAudioResource, StreamType } from "@discordjs/voice";
import ytdl from "ytdl-core";
import ytdlPlayer from "ytdl-core-discord";
import ytpl from "ytpl";

type SimpleMetadata = {
  type: "video" | "playlist" | "unknown";
  title: string;
  author: string;
  numberOfTracks: number;
};

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
  const cacheHit = checkCacheExists(track.id);
  let stream;
  if (cacheHit) {
    stream = readFromCache(track.id);
  } else {
    stream = await ytdlPlayer(track.url, options);
    // write the track to cache
    const cacheStream = await ytdlPlayer(track.url, options);
    writeToCache(track.id, cacheStream);
  }
  return createAudioResource(stream, {
    inputType: StreamType.Opus,
    metadata: {
      title: track.title,
    },
  });
}
