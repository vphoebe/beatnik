import { checkIdIsCached, readFromCache, writeToCache } from "./cache.js";
import { QueuedTrack, TrackService } from "./queue.js";
import { durationStringToSeconds } from "./util.js";
import { StreamType, createAudioResource, demuxProbe } from "@discordjs/voice";
import ytdl from "@distube/ytdl-core";
import ytpl from "@distube/ytpl";
import ytsr from "@distube/ytsr";
import { Readable } from "stream";

type SimpleMetadata = {
  type: "video" | "playlist" | "unknown";
  title: string;
  author: string;
  numberOfTracks: number;
};

type ParsedQuery = {
  url: string;
  service: TrackService;
  type: "playlist" | "video";
};

function isValidUrl(query: string): URL | null {
  let urlObject;
  try {
    urlObject = new URL(query);
    return urlObject;
  } catch (err) {
    return null;
  }
}

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
    const ytStream = ytdl(url, {
      filter: "audioonly",
      quality: "highestaudio",
    });
    const cacheSource = ytdl(url, {
      filter: "audioonly",
      quality: "highestaudio",
    });
    writeToCache(id, cacheSource);
    const { type } = await demuxProbe(ytStream);
    return {
      stream: ytStream,
      type,
      fromCache: false,
    };
  } else {
    // we know this cache stream exists because we checked the cache hit
    const cacheStream = readFromCache(id) as Readable;
    const { type } = await demuxProbe(cacheStream);
    return { stream: cacheStream, fromCache: true, type };
  }
}

export async function parsePlayQuery(query: string): Promise<ParsedQuery> {
  // return playable URL from play command query
  const urlObject = isValidUrl(query);
  if (!urlObject) {
    // do search
    const searchResults = await ytsr(query, { limit: 1 });
    if (searchResults && searchResults.results > 0) {
      return {
        url: searchResults.items[0].url,
        service: TrackService.YouTube,
        type: "video",
      };
    } else {
      throw new Error(`No results found for ${query}!`);
    }
  } else {
    // see if it's a valid service url
    const url = urlObject.toString();
    if (url.includes("playlist") && ytpl.validateID(url)) {
      // add .includes() check to prevent single videos from queuing a playlist
      return {
        url,
        service: TrackService.YouTube,
        type: "playlist",
      };
    } else if (ytdl.validateURL(url)) {
      return {
        url,
        service: TrackService.YouTube,
        type: "video",
      };
    } else {
      throw new Error(`Unsupported URL: ${url}`);
    }
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
    const { videoDetails, player_response } = info;
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
      loudness: player_response.playerConfig.audioConfig.loudnessDb,
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
  const { stream, fromCache, type } = await getYtStream(track.id, track.url);

  if (!track.loudness) {
    // ytpl tracks can't retrieve this, so get it now
    const info = await ytdl.getInfo(track.url);
    track.loudness = info.player_response.playerConfig.audioConfig.loudnessDb;
  }

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
