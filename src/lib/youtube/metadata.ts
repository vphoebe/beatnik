import ytdl from "@distube/ytdl-core";
import ytpl from "@distube/ytpl";
import ytsr from "@distube/ytsr";
import { getPlaylistWithTracks, getTrackByUrl } from "../library/db.js";
import { agent } from "./agent.js";

interface Query {
  query: string;
  type: "playlist" | "track" | "query";
}

export interface Track {
  id: string;
  url: string;
  title: string;
  thumbnailUrl: string | null;
  channelName: string | null;
  length: number;
  loudness: number | null;
  playlistIdx: number | null;
}

export interface Playlist {
  id: string;
  url: string;
  title: string;
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

async function getTrackInfo(
  url: string,
  useLibrary: boolean,
): Promise<Track | undefined> {
  const existingTrack = await getTrackByUrl(url);
  if (existingTrack && useLibrary) {
    return existingTrack;
  }
  try {
    const info = await ytdl.getInfo(url, { agent });
    const { videoDetails, player_response } = info;
    const { title, lengthSeconds, thumbnails, author, videoId, video_url } =
      videoDetails;
    return {
      title,
      url: video_url,
      length: parseInt(lengthSeconds),
      id: videoId,
      channelName: author.name,
      thumbnailUrl: thumbnails[0].url,
      loudness: player_response.playerConfig.audioConfig.loudnessDb,
      playlistIdx: null,
    };
  } catch (err) {
    console.error(`Error for ${url}`);
    console.error(err);
  }
}

async function getPlaylistInfo(
  idOrUrl: string,
  useLibrary: boolean,
): Promise<Playlist> {
  const existingPlaylist = await getPlaylistWithTracks(idOrUrl);
  if (existingPlaylist && useLibrary) {
    return existingPlaylist;
  }
  const playlistInfo = await ytpl(idOrUrl, { limit: Infinity });
  const infoPromises = playlistInfo.items.map((t) =>
    getTrackInfo(t.url, false),
  );
  const data = await Promise.all(infoPromises);
  const tracks = data
    .filter((t) => t !== undefined)
    .map((track, idx) => ({ ...track, playlistIdx: idx }));

  return {
    tracks,
    title: playlistInfo.title,
    url: playlistInfo.url,
    id: playlistInfo.id,
    authorName: playlistInfo.author?.user ?? "Unknown",
  };
}

export async function getMetadataFromQuery(query: string, useLibrary = true) {
  const parsedQuery = getQueryType(query);

  if (!parsedQuery) {
    return undefined;
  }

  switch (parsedQuery.type) {
    case "track": {
      return {
        track: await getTrackInfo(parsedQuery.query, useLibrary),
        type: "track ",
      };
    }
    case "query": {
      const searchResults = await ytsr(parsedQuery.query, { limit: 1 });
      return {
        track: await getTrackInfo(searchResults.items[0].url, useLibrary),
        type: "track",
      };
    }
    case "playlist": {
      return {
        playlist: await getPlaylistInfo(parsedQuery.query, useLibrary),
        type: "playlist",
      };
    }
  }
}
