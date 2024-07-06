import ytdl from "@distube/ytdl-core";
import ytpl from "@distube/ytpl";
import ytsr from "@distube/ytsr";
import { durationStringToSeconds } from "../util.js";

interface Query {
  query: string;
  type: "playlist" | "track" | "query";
}

export interface Track {
  id: string;
  title: string;
  thumbnailUrl?: string;
  channelName?: string;
  length: number;
  loudness: number;
  playlistId?: string;
}

export interface Playlist {
  id: string;
  authorName: string;
  tracks: Track[];
}

function isValidUrl(query: string): URL | null {
  let urlObject;
  try {
    urlObject = new URL(query);
    return urlObject;
  } catch (err) {
    return null;
  }
}

function getQueryType(query: string): Query | null {
  const urlObj = isValidUrl(query);
  if (urlObj) {
    // check if url is track, playlist, or none
    const url = urlObj.toString();
    if (url.includes("playlist") && ytpl.validateID(url)) {
      return {
        query,
        type: "playlist",
      };
    } else if (ytdl.validateURL(url)) {
      return {
        query,
        type: "track",
      };
    } else {
      return null;
    }
  } else {
    return {
      query,
      type: "query",
    };
  }
}

export async function getTracksFromQuery(
  query: string,
): Promise<Partial<Playlist> & { tracks: Track[] }> {
  async function getTrackInfo(url: string): Promise<Track> {
    const info = await ytdl.getInfo(url);
    const { videoDetails, player_response } = info;
    const { title, lengthSeconds, thumbnails, author, videoId } = videoDetails;
    return {
      title,
      length: parseInt(lengthSeconds),
      id: videoId,
      channelName: author.name,
      thumbnailUrl: thumbnails[0].url,
      loudness: player_response.playerConfig.audioConfig.loudnessDb,
    };
  }

  const parsedQuery = getQueryType(query);

  if (!parsedQuery) {
    return { tracks: [] };
  }

  switch (parsedQuery.type) {
    case "track": {
      const track = await getTrackInfo(parsedQuery.query);
      return { tracks: [track] };
    }
    case "query": {
      const searchResults = await ytsr(parsedQuery.query, { limit: 1 });
      const track = await getTrackInfo(searchResults.items[0].url);
      return { tracks: [track] };
    }
    case "playlist": {
      const playlistInfo = await ytpl(parsedQuery.query, { limit: Infinity });
      const tracks: Track[] = playlistInfo.items.map((item) => ({
        title: item.title,
        length: durationStringToSeconds(item.duration ?? "0:00"),
        id: item.id,
        channelName: item.author?.name,
        thumbnailUrl: item.thumbnail,
        loudness: 0, //TODO: GET REAL LOUDNESS VALUE
      }));
      return {
        tracks,
        id: playlistInfo.id,
        authorName: playlistInfo.author?.name,
      };
    }
  }
}
