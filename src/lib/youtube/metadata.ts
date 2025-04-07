import ytdl from "@distube/ytdl-core";
import ytpl from "@distube/ytpl";
import ytsr from "@distube/ytsr";

import { getSavedPlaylistByUrl } from "../library/db/playlist.js";
import { getAllTracks, getTrackByUrl } from "../library/db/track.js";
import { durationStringToSeconds } from "../util.js";
import { agent } from "./agent.js";

interface Query {
  query: string;
  type: "playlist" | "track" | "query";
}

export interface YtApiTrack {
  id: string;
  url: string;
  title: string;
  thumbnailUrl: string;
  channelName: string;
  length: number;
  loudness: number;
  playlistIdx: number | null;
}

export interface YtApiPlaylist {
  id: string;
  url: string;
  title: string;
  authorName: string;
  tracks: YtApiTrack[];
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

async function getTrackInfo(url: string, useLibrary: boolean): Promise<YtApiTrack | undefined> {
  const existingTrack = await getTrackByUrl(url);
  if (existingTrack && useLibrary) {
    return existingTrack;
  }
  try {
    const info = await ytdl.getInfo(url, { agent, playerClients: ["WEB"] });
    const { videoDetails, player_response } = info;
    const { title, lengthSeconds, thumbnails, author, videoId, video_url } = videoDetails;
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

async function getPlaylistInfo(url: string, useLibrary: boolean): Promise<YtApiPlaylist> {
  const existingPlaylist = await getSavedPlaylistByUrl(url);
  if (existingPlaylist && useLibrary) {
    return existingPlaylist;
  }
  const playlistInfo = await ytpl(url, { limit: Infinity });

  const tracksWithoutLoudness: Omit<YtApiTrack, "loudness">[] = playlistInfo.items.map(
    (item, idx) => ({
      title: item.title,
      length: durationStringToSeconds(item.duration ?? "0:00"),
      url: item.url,
      id: item.id,
      channelName: item.author?.name ?? "Unknown",
      thumbnailUrl: item.thumbnail ?? "",
      playlistIdx: idx,
    }),
  );

  // use existing loudness data if possible
  const loudnessData = (await getAllTracks()).map((t) => ({
    id: t.id,
    loudness: t.loudness,
  }));

  const tracks: YtApiTrack[] = [];

  for (const track of tracksWithoutLoudness) {
    const match = loudnessData.find((t) => t.id === track.id);
    if (match) {
      tracks.push({ ...track, loudness: match.loudness });
    } else {
      const info = await ytdl.getInfo(track.url, {
        agent,
        playerClients: ["WEB_EMBEDDED"],
      });
      tracks.push({
        ...track,
        loudness: info.player_response.playerConfig.audioConfig.loudnessDb,
      });
    }
  }

  return {
    tracks,
    title: playlistInfo.title,
    url: playlistInfo.url,
    id: playlistInfo.id,
    authorName: playlistInfo.author?.user ?? "Unknown",
  };
}

export async function getMetadataFromQuery(query: string, options: { useLibrary: boolean }) {
  const { useLibrary } = options;
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
